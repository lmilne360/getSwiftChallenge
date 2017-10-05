$(document).ready(() => {
  this.getWarehouseCords()
  this.getDrones()
  this.getPackages()
})

const proxyurl = "https://cors-anywhere.herokuapp.com/"; // heroku cors
const dronesEndpoint = "https://codetest.kube.getswift.co/drones" // Endpoint for random drones
const packagesEndpoint = "https://codetest.kube.getswift.co/packages" // Endpoint forrandom packages
const gcords = "https://maps.googleapis.com/maps/api/geocode/json?" //google maps geocoding endpoint
const warehouseAddress = "303 Collins Street, Melbourne, VIC 3000"
var wareCords;
//const wareHouselnglat; 
var drones;
var packages;
var availableDrones;
var assignments = [];
var unassigned = [];
var results = {}


function getWarehouseCords() {
  $.get(proxyurl + gcords + `address=${warehouseAddress}`, (data) => {
    wareCords = data.results[0].geometry.location
  })
}

function getDrones() {
  $.get(proxyurl + dronesEndpoint, (drones) => {
    drones.sort((a, b) => {
      return a.packages.length > b.packages.length ? 1 : (a.packages.length < b.packages.length ? -1 : 0);
    })
    this.drones = drones;
    this.getAvailableDrones(drones);
  })
};

// get all packages and sort by deadline
function getPackages() {
  $.get(proxyurl + packagesEndpoint, (data) => {

    data.sort((a, b) => {
      return a.deadline > b.deadline ? 1 : (a.deadline < b.deadline ? -1 : 0);
    });
    this.packages = data;
  })
};


function getAvailableDrones(dronesArr) {
  this.availableDrones = dronesArr.filter((drone) => {
    return drone.packages.length === 0
  })
  this.sortByDistance(availableDrones);
}

function sortByDistance(dronesArr) {

  dronesArr.forEach((drone) => {
    drone.distance = calculateDistance(drone.location.latitude, drone.location.longitude)
  })

  //sort by distance
  dronesArr.sort((a, b) => {
    return a.distance > b.distance ? 1 : (a.distance < b.distance ? -1 : 0);
  });

  this.makeAssignment(dronesArr)
}

function makeAssignment(dronesArr) {

  if (dronesArr && dronesArr.length !== 0) {
    dronesArr.forEach(function (drone, i) {

      if (drone.packages.length === 0 && this.packages.length > 0) {
        drone.packages.push(this.packages.shift())
      }

      assignments.push(new Assignment(drone))
      //debugger
    })
  } else {
    this.assignments = []
  }

  if (packages.length > 0) {
    packages.forEach((package) => {
      unassigned.push(package.packageId)
    })
  }

  results.assignments = assignments;
  results.unassignedPackageIds = unassigned;
  //$('#results').text(JSON.stringify(results))
  document.body.innerHTML = JSON.stringify(results)
}

function calculateDistance(lat1, lon1, lat2 = wareCords.lat, lon2 = wareCords.lng) {
  var radlat1 = Math.PI * lat1 / 180
  var radlat2 = Math.PI * lat2 / 180
  var theta = lon1 - lon2
  var radtheta = Math.PI * theta / 180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180 / Math.PI
  dist = dist * 60 * 1.1515

  //convert to kilometers
  dist = dist * 1.609344

  return dist
}

// Assignment class
function Assignment(drone) {
  this.droneId = drone.droneId;
  this.packageId = drone.packages[0].packageId;
}

//Sort packages by due date, closest due date first
//Sort 

/**
 * Sort the packages by due dates, closest due dates most important
 * sort the drones by availability, first ones without packages, then ones closest
 * place priority packages in empty drones
 * get geolocation of destination to compare distance
 * MAYBE sort for how long it would take to get to certain point( distance from its postion to package location first then back to base)
 */