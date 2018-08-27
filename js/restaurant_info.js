let restaurant;
var map;


document.addEventListener('DOMContentLoaded', () => {
    window.initMap = () => {
        fetchRestaurantFromURL((error, restaurant) => {
            if (error) {
                console.error(error);
            } else {
                self.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 16,
                    center: self.restaurant.latlng,
                    scrollwheel: false
                });

                document.getElementById('map').setAttribute('role', 'application');

                DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
                fillBreadcrumb();

                document
                    .getElementById('review-submit')
                    .addEventListener('click', submitReview);
            }
        });
    };
    DBHelper.loadFromIDB('pending-reviews', 'pending-reviews')
        .then(data => {
            if (data.length == 0) {
                return;
            }

            if (!self.pendingReviews) {
                self.pendingReviews = [];
            }

            data.forEach(rev => {
                self.pendingReviews.push(rev);
            });


            if (navigator.connection.downlink != 0) {
                data.forEach(rev => {
                    delete rev.id;
                    DBHelper.postToAPI(rev).then(function () {
                        DBHelper.deleteInIDB('pending-reviews', 'pending-reviews');
                    });
                });
            }

            return data;
        })
        .catch(err => {
            console.log(`ERROR DB: ${err.status}`);
        });
});

fetchRestaurantFromURL = callback => {
    if (self.restaurant) {
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) {
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant);
        });
    }
};

fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const picture = document.getElementById('restaurant-img');

    const source620Webp = document.createElement('source');
    source620Webp.media = '(min-width: 620px) and (max-width: 980px)';
    source620Webp.srcset = DBHelper.imageUrlForRestaurant(restaurant)
        .split('.jpg')
        .join('_800.webp');

    const sourceWebp = document.createElement('source');
    sourceWebp.srcset = DBHelper.imageUrlForRestaurant(restaurant)
        .split('.jpg')
        .join('.webp');

    const source620 = document.createElement('source');
    source620.media = '(min-width: 620px) and (max-width: 3000px)';
    source620.srcset = DBHelper.imageUrlForRestaurant(restaurant)
        .split('.jpg')
        .join('_800.jpg');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = `Restaurant ${restaurant.name}`;
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.setAttribute('aria-label', name.innerHTML + ' restaurant');
    picture.appendChild(source620Webp);
    picture.appendChild(source620);
    picture.appendChild(sourceWebp);
    picture.appendChild(image);
    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;


    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    getReviewsById();
};


fillRestaurantHoursHTML = (
    operatingHours = self.restaurant.operating_hours
) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);
        time.style.color = '#525252';
        hours.appendChild(row);
    }
};


fillReviewsHTML = (reviews = self.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }


    if (self.pendingReviews) {
        reviews.push(...self.pendingReviews);
    }

    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};


createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('h3');
  name.innerHTML = review.name;
  name.tabIndex = "0";
  li.appendChild(name);

  const date = document.createElement('span');
  const dateString = new Date(review.createdAt);
  date.innerHTML = dateString.toDateString();
  name.appendChild(date);

  const rating = document.createElement('em');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};


fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

getParameterByName = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};


getReviewsById = callback => {
    if (self.reviews) {
        callback(null, self.reviews);
        return;
    }
    const id = getParameterByName('id');
    if (!id) {
        error = 'Could not get parameter id';
        callback(error, null);
    } else {
        DBHelper.fetchReviewsById(id, (error, reviews) => {
            self.reviews = reviews;
            if (!reviews) {
                console.error(error);
                return;
            }
            fillReviewsHTML();
        });
    }
};


submitReview = e => {
    e.preventDefault();
    let nameNode = document.getElementById('review-name');
    let reviewNode = document.getElementById('review-text');
    let rating = parseInt(
        document.querySelector('input[name="rating"]:checked').value
    );

    let name = nameNode.value;
    let comments = reviewNode.value;

    let newReview = {
        restaurant_id: self.restaurant.id,
        name,
        rating,
        comments,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    DBHelper.postToAPI(newReview).then(function () {

        nameNode.value = '';
        reviewNode.value = '';

        const newReviewHTML = createReviewHTML(newReview);
        const ul = document.getElementById('reviews-list');
        ul.appendChild(newReviewHTML);

        const reviewStatus = document.getElementById('review-status');
        reviewStatus.innerText = 'Thanks for reviewing!';

        google.maps.event.addListenerOnce(map, 'idle', () => {
            document.getElementsByTagName('iframe')[0].title = "Google Maps";
        })
    });
};
