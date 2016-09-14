"use strict";
var map;

// markers array
var markers = [
    {
        title: "Regal Winter Park Village Stadium 20 & RPX",
        lat: 28.60194,
        lng: -81.36188
    },
    {
        title: "Pizzeria Valdiano",
        lat: 28.60169,
        lng: -81.36223
    },
    {
        title: "Publix Super Market at Winter Park Village",
        lat: 28.60089,
        lng: -81.36288
    },
    {
        title: "The Cheesecake Factory",
        lat: 28.60288,
        lng: -81.36274
    },
    {
        title: "Starbucks",
        lat: 28.60321,
        lng: -81.36464
    },
    {
        title: "Game Stop",
        lat: 28.60225,
        lng: -81.36337
    },
    {
        title: "BRIO Tuscan Grille",
        lat: 28.60201,
        lng: -81.36393
    },
    {
        title: "Guitar Center",
        lat: 28.60315,
        lng: -81.36282
    },
    {
        title: "Paseo at Winter Park Village",
        lat: 28.59972,
        lng: -81.36184
    },
    {
        title: "Ruth's Chris Steak House",
        lat: 28.60361,
        lng: -81.36388
    }

];

// initiate google map
function initMap() {
    var myLatLng =  {lat: 28.60188, lng: -81.36318};

    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'),{
        zoom: 17,
        center: myLatLng
    })

    // Create a marker and set its position.
    var image = {
        url: 'images/peacock.png',
        scaledSize: new google.maps.Size(100, 100),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 30)
    };
    var center = new google.maps.Marker({
        map: map,
        position: myLatLng,
        title: 'Winter Park Village',
        icon: image
    });

    // Add responsiveness to the map
    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

    ko.applyBindings(new viewModel());
}

function googleError(){
    console.trace();
    alert("Error occurs loading Google Map API");
}


/*
    Return an URL to a Foursqaure query that returns the venue ID
    and data. Takes latitude, longitude, and name of venues

*/
function foursquareQuery(lat, lng, name){
    var client_id = "2IUNCOTIR2UY5IBWIVK3YK3KX52LLTMUQO4UZF5SKQI0OV2I";
    var client_secret = "IJQHBFGENYEJ3C2BZXXRDYDJZGCPEGSFFGAAJRABKOSEISSY";

    var query = "https://api.foursquare.com/v2/venues/search?client_id="
                + client_id + "&client_secret="
                + client_secret
                + "&ll=" + lat + "," + lng
                + "&query=" + encodeURIComponent(name)
                + "&v=20160908&limit=1";
    return query;
}

var infowindowDefault = '<div style="width: 100px; height: 30px;"><p style="text-align: center;">Loading</p></div>';

// define viewModel
var viewModel = function() {
    var self = this;
    // initiate observable to store user input
    self.userInput = ko.observable("");
    // initiate oberservable array to store info of locations
    self.locationList = ko.observableArray();
    markers.forEach(function(marker){
        self.locationList.push(new loc(marker));
    });

    // initiate google map infowindow
    self.infowindow = new google.maps.InfoWindow({
        content: infowindowDefault
    });

    // function that handles everything related to a infowindow
    self.infowindowOutput = function(location) {
        for(var i = 0, len = markers.length; i < len; i++){
            self.locationList()[i].marker.setAnimation(null);
        }
        // add on click animation to marker
        location.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            location.marker.setAnimation(null)
        }, 3000);
        self.infowindow.open(map, location.marker);
        self.infowindow.setContent(infowindowDefault);
        self.getFoursquareData(location);
    }
    // initiate a list of markers to show
    self.markersList = ko.computed(function(){
        var list = [];
        var length = self.locationList().length;
        var bounds = new google.maps.LatLngBounds();
        // close infowindow every time we update the data
        self.infowindow.close();

        for(var i = 0; i < length; i++){
            if (self.locationList()[i].title().toLowerCase().indexOf(self.userInput().toLowerCase()) != -1) {
                list.push(self.locationList()[i]);
                self.locationList()[i].showMarker(map);
                var myLatLng = new google.maps.LatLng(self.locationList()[i].lat, self.locationList()[i].lng);
                bounds.extend(myLatLng)
            }
            else {
                // for the items that are not a match, we turn off the markers
                self.locationList()[i].showMarker(null);
            }
        }
        map.fitBounds(bounds);
        // return a filered list in alphabetical order
        return list.sort(function(l, r){ return l.title() > r.title() ? 1 : -1;});
    });

    // download Foursqaure data asynchronously using ajax
    self.getFoursquareData = function(venue) {
            var url = foursquareQuery(venue.lat, venue.lng, venue.title());

            $.getJSON(url)
                .done(function(data) {
                    console.log("successfully downloaded foursquare data");
                    var result = data.response.venues[0];
                    var category = result.categories[0].name;
                    var name = result.name;
                    var address = result.location.formattedAddress;
                    var id = result.id;
                    var url = result.url;
                    var phone = result.contact.formattedPhone;
                    var foursquareUrl = "https://foursquare.com/v/" + id;
                    var output = "<h5>" + name + "</h5>" + category + "<hr>"
                                + "<strong>Address: </strong>" + address + "<br>"
                                + "<strong>Phone number: </strong>" + phone + "<br>";
                    if(url !== undefined){
                        output += "For more info please visit <strong><a href='" + url + "'>venue website</a></strong>"
                            +" or <strong><a href='" + foursquareUrl + "'>Foursquare</a></strong>";

                    }
                    else{
                        output += "<strong><a href='" + foursquareUrl + "'>For more info please visit Foursquare</a></strong>"
                    }
                    self.infowindow.setContent(output);
            })
            .fail(function(){
                var output = "Error occurs while getting foursquare data"
                console.log(output);
                self.infowindow.setContent(output);
            })
    };

    // iterate through locationList ko observable array
    self.locationList().forEach(function(location){
        // add event listener for 'click' to each location.marker
        location.marker.addListener('click', (function(){
            return function(){
                self.infowindowOutput(location);
                self.infowindow.open(map, location.marker);
            }
        })(location));
    });

    // initiate observable to store the state of list view
    self.showList = ko.observable(true);

    self.toggle = function(){
        self.showList(!self.showList());
    }
};

// loc object to store info of markers
var loc = function(marker){
    var self = this;
    self.title = ko.observable(marker.title);
    self.lat = marker.lat;
    self.lng = marker.lng;

    self.marker = new google.maps.Marker({
        position: {lat: self.lat, lng: self.lng},
        map: map
    });

    self.showMarker = function(map) {
        if (map !== null){
            self.marker.setVisible(true);
        }
        else{
            self.marker.setVisible(false);
        }
    };
}

