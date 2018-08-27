let restaurants, neighborhoods, cuisines;
var map;
var markers = [];

var myLazyLoad = new LazyLoad({
    elements_selector: 'img, .lazy'
});


document.addEventListener('DOMContentLoaded', () => {
    fetchNeighborhoods();
    fetchCuisines();
    updateRestaurants();

});


fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error != null) {
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};


fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        option.setAttribute('aria-label', neighborhood);
        option.setAttribute('role', 'option');
        select.append(option);
    });
};


fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) {
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};


fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        option.setAttribute('aria-label', cuisine);
        option.setAttribute('role', 'option');
        select.append(option);
    });
};


window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    updateRestaurants();
};


updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(
        cuisine,
        neighborhood,
        (error, restaurants) => {
            if (error) {
                console.error(error);
            } else {
                resetRestaurants(restaurants);
                fillRestaurantsHTML();
                myLazyLoad.update();
            }
        }
    );
};

resetRestaurants = restaurants => {
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
};


fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};


createRestaurantHTML = restaurant => {
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');
    li.setAttribute('tabindex', '0');

    const favoriteContainer = document.createElement('div');
    const favorite = document.createElement('span');
    favorite.setAttribute('role', 'img');
    favorite.setAttribute('aria-label', 'favorite');
    favorite.setAttribute('id', 'favorite-icon');

    if (restaurant.is_favorite == null || restaurant.is_favorite == undefined) {
        restaurant.is_favorite = false;
    }

    favorite.dataset.liked = restaurant.is_favorite;

    if (favorite.dataset.liked == 'true') {
        favoriteContainer.classList.remove('not-favorite');
        favoriteContainer.classList.add('favorite');
    } else {
        favoriteContainer.classList.remove('favorite');
        favoriteContainer.classList.add('not-favorite');
    }


    favorite.addEventListener('click', e => {
        if (e.target.dataset.liked == 'false') {
            e.target.dataset.liked = true;
            e.target.parentNode.classList.remove('not-favorite');
            e.target.parentNode.classList.add('favorite');
        } else {
            e.target.dataset.liked = false;
            e.target.parentNode.classList.remove('favorite');
            e.target.parentNode.classList.add('not-favorite');
        }

        restaurant.is_favorite = e.target.dataset.liked;
        DBHelper.favoriteRestaurant(restaurant);
    });

    favoriteContainer.append(favorite);
    li.append(favoriteContainer);

    const picture = document.createElement('picture');

    const source700Webp = document.createElement('source');
    source700Webp.media = '(min-width: 700px) and (max-width: 1380px)';
    source700Webp.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant)
        .split('.jpg')
        .join('_400.webp');

    const sourceWebp = document.createElement('source');
    sourceWebp.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant)
        .split('.jpg')
        .join('.webp');

    const source700 = document.createElement('source');
    source700.media = '(min-width: 700px) and (max-width: 1380px)';
    source700.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant)
        .split('.jpg')
        .join('_400.jpg');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = `Restaurant ${restaurant.name}`;
    picture.append(source700Webp);
    picture.append(source700);
    picture.append(sourceWebp);
    picture.append(image);
    li.append(picture);

    const name = document.createElement('h3');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.setAttribute('aria-label', 'View details for restaurant')
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);

    return li;
};

addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url;
        });
        self.markers.push(marker);
    });
};

window.addEventListener('load', () => {
    myLazyLoad.update();
});
