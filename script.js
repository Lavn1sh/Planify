'use strict';

class Plan {
  nowDate = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, place, date, time, description) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; // [lat, lng]
    this.place = place;
    this.date = new Date(date);
    this.time = time;
    this.description = description;
    this._setSummary();
  }

  _setSummary() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.summary = `On ${+(this.date).getDate()} ${months[+(this.date).getMonth()]} ${+(this.date.getFullYear())}, ${this.time} at ${this.place}`;
  }

  click() {
    this.clicks++;
  }
}


///////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerPlans = document.querySelector('.plans');
const inputPlace = document.querySelector('.form__input--place');
const inputDate = document.querySelector('.form__input--date');
const inputTime = document.querySelector('.form__input--time');
const inputDescription = document.querySelector('.form__input--description');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #plans = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this.#newPlan.bind(this));
    containerPlans.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#plans.forEach(plan => {
      this.#renderPlanMarker(plan);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputPlace.focus();
  }

  _hideForm() {
    // Empty inputs
    inputPlace.value = inputTime.value = inputDate.value = inputDescription.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }


  #newPlan(e) {
    e.preventDefault();
    // Get data from form
    const place = inputPlace.value;
    const date = inputDate.value;
    const time = inputTime.value;
    const description = inputDescription.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const plan = new Plan([lat, lng], place, date, time, description);

    // Add new object to plan array
    this.#plans.push(plan);

    // Render plan on map as marker
    this.#renderPlanMarker(plan);

    // Render plan on list
    this._renderPlan(plan);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all plans
    this._setLocalStorage();
  }

  #renderPlanMarker(plan) {
    L.marker(plan.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `plan-popup`,
        })
      )
      .setPopupContent(
        `${plan.summary}`
      )
      .openPopup();
  }

  _renderPlan(plan) {
    let html = `
      <li class="plan" data-id="${plan.id}">
        <h2 class="plan__title">${plan.summary}</h2>
        <div class="plan__details">
          <span class="plan__value"><strong>PLACE:</strong> ${plan.place}</span>
        </div>
        <div class="plan__details">
          <span class="plan__value"><strong>DATE:</strong> ${plan.summary.slice(3).split(',')[0]}</span>
        </div>
        <div class="plan__details">
          <span class="plan__value"><strong>TIME:</strong> ${plan.time}</span>
        </div>
        <span class="plan__value plan__value--description"><strong>DESCRIPTION:</strong> ${plan.description}</span>
        </div>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    // BUGFIX: When we click on a plan before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const planEl = e.target.closest('.plan');

    if (!planEl) return;

    const plan = this.#plans.find(
      work => work.id === planEl.dataset.id
    );

    this.#map.setView(plan.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // plan.click();
  }

  _setLocalStorage() {
    localStorage.setItem('plans', JSON.stringify(this.#plans));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('plans'));

    if (!data) return;

    this.#plans = data;

    this.#plans.forEach(plan => {
      this._renderPlan(plan);
    });
  }

  reset() {
    localStorage.removeItem('plans');
    location.reload();
  }
}

const app = new App();
