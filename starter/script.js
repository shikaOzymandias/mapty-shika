'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'];



class Workout {
    date = new Date();
    id = ( Date.now() + '' ).slice(-10);
    constructor(coords , distance , duration) {
        this.coords = coords; // [lat , lng]
        this.distance = distance; //per km
        this.duration = duration; //per min
    }
    _setDescription (){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'];
        // Running on April 14

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}
         ${this.date.getDate()}`;
    }

};

class Running extends Workout {
    type = 'running';
    constructor(coords , distance , duration , cadence) {
        super(coords , distance , duration);
        this.cadence = cadence ;
        // this.type = 'running';
        this.calcPace();
        this._setDescription();
    }

    calcPace () {
        // min/km
        this.pace = this.duration / this.distance ;
        return this.pace
    }
};

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords , distance , duration , elevationGain) {
        super(coords , distance , duration);
        this.elevationGain = elevationGain ;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed () {
        // km / hour(60min)
        this.speed =  this.distance / (this.duration / 60) ;
        return this.speed;
    }
};

//////////////////////////////////////////////////
// APPLICATTION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        // Get user's postion
        this._getPostion();
        // get User's local storage
        this._getLocalStorage();
        // Attach event handlers
        form.addEventListener('submit',this._newWorkout.bind(this));
        inputType.addEventListener('change',this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    }

    _getPostion() {
        if (navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function (){
                alert('Could not found your location.');
            });

        }
    }

    _loadMap(position) {

            const {latitude} = position.coords;
            const {longitude} = position.coords;
            console.log(`https://www.google.com/maps/@${latitude},${longitude}`)
            const coords= [latitude,longitude];

            this.#map = L.map('map').setView(coords, 16);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

            // Handle click on Map
            this.#map.on('click',this._showForm.bind(this));

            // For rendering Marker from local Storage
            this.#workouts.forEach(work => {
                this._renderWorkoutMarker(work);
            });
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '' ;
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=>( form.style.display = 'grid'),1000);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }



    _newWorkout(e) {

        // Functions
        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault();
        // Get data from form
        const type = inputType.value;
        const duration = +inputDuration.value;
        const distance = +inputDistance.value;
        const {lat , lng} = this.#mapEvent.latlng;
        let workout;
        // if Running , create running object
        if (type === 'running'){
            const cadence = +inputCadence.value;
            // Check data if valid
            if (
                !validInputs(distance,duration,cadence) ||
                !allPositive(distance,duration,cadence)
            )
                return alert('Inputs have to be Positive Numbers');
            workout = new Running([lat,lng],distance,duration,cadence);


        }

        // If Cycling Create Cycling Object
        if (type === 'cycling'){
            const elevation = +inputElevation.value;
            // Check data if valid
            if (
                !validInputs(distance,duration,elevation) ||
                !allPositive(distance,duration)
            )
                return alert('Inputs have to be Positive Numbers');
            workout = new Cycling([lat,lng],distance,duration,elevation);

        }
        // Add new object to Workouts array
        this.#workouts.push(workout);
        console.log(workout);
        // Render workout on Map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);
        // Hide form + clear input fields
        this._hideForm();
        // Set local storage to all workouts
        this._setLocalStorage();
    }



    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth:250,
                    minWidth:100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`${
                workout.type === 'running' ?'🏃🏻‍♂️':'🚴🏻‍♀️'} ${workout.description}`)
            .openPopup();


    }

    _renderWorkout(workout) {

        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
            workout.type === 'running' ?'🏃🏻‍♂️':'🚴🏻‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
              <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;

        if (workout.type === 'running')
            html+=`
             <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
             </div>
             <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
             </div>
          </li>
            `;

        if (workout.type === 'cycling')
            html+=`
             <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
            `;

        form.insertAdjacentHTML('afterend',html);
    }

    _moveToPopup (e){
        const workoutsEl = e.target.closest('.workout');
        console.log(workoutsEl);

        if (!workoutsEl) return;

        const workout = this.#workouts.find(
            work=> work.id === workoutsEl.dataset.id
        );

        this.#map.flyTo(workout.coords, 17,{
            animate:true,
            pan:{
                duration:1,
            }
        })
    }

    _setLocalStorage() {
        localStorage.setItem('workouts',JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if (!data) return;
        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }
     _reset (){
        localStorage.removeItem('workouts');
        location.reload();
     }
}

const app = new App();




