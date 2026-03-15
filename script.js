const CONFIG = {
    API_KEY: '71e871e5bf7ba4dc35c8c67cb77fc4aa',
    API_URL: 'https://api.openweathermap.org/data/2.5/weather',
    UNITS: 'metric', // metric = Цельсий, imperial = Фаренгейт
    DEFAULT_MESSAGE: 'Введите название города для поиска 🔍'
};

const elements = {
    form: document.getElementById('weather-form'),
    input: document.getElementById('city-input'),
    msg: document.getElementById('message'),
    list: document.getElementById('cities-list'),
    apiStatus: document.getElementById('api-status')
};

/**
 * Показывает сообщение пользователю
 * @param {string} text - Текст сообщения
 * @param {string} type - Тип сообщения ('error', 'info', 'success')
 */
function showMessage(text, type = 'info') {
    if (!elements.msg) return;
    
    elements.msg.textContent = text;
    elements.msg.className = 'msg ' + type;
    
    if (type !== 'error') {
        setTimeout(() => {
            if (elements.msg) {
                elements.msg.textContent = CONFIG.DEFAULT_MESSAGE;
                elements.msg.className = 'msg';
            }
        }, 5000);
    }
}

/**
 * Проверяет статус API ключа
 */
function checkApiKey() {
    if (!CONFIG.API_KEY || CONFIG.API_KEY === 'YOUR_API_KEY_HERE' || CONFIG.API_KEY.length < 10) {
        elements.apiStatus.textContent = '⚠️ ВНИМАНИЕ: Необходимо указать ваш API ключ OpenWeatherMap в файле script.js!';
        elements.apiStatus.style.color = '#ff8c00';
        return false;
    }
    elements.apiStatus.textContent = '✅ API ключ активен, приложение готово к работе';
    elements.apiStatus.style.color = '#4caf50';
    return true;
}

/**
 * Проверяет, есть ли уже такой город в списке
 * @param {string} cityName - Название города
 * @param {string} countryCode - Код страны
 * @returns {boolean} - true если город уже есть
 */
function isCityDuplicate(cityName, countryCode) {
    const existingCities = document.querySelectorAll('.city');
    
    for (let city of existingCities) {
        const nameElement = city.querySelector('.city-name');
        if (!nameElement) continue;
        
        const dataName = nameElement.dataset.name || '';
        const searchName = `${cityName.toLowerCase()},${countryCode.toLowerCase()}`;
        
        if (dataName.toLowerCase() === searchName) {
            return true;
        }
    }
    return false;
}

/**
 * Создает HTML элемент карточки города
 * @param {Object} weatherData - Данные о погоде от API
 * @returns {HTMLLIElement} - Готовая карточка города
 */
function createCityCard(weatherData) {
    const { name, main, sys, weather } = weatherData;
    
    const iconCode = weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    const li = document.createElement('li');
    li.classList.add('city');
    
    li.innerHTML = `
        <h2 class="city-name" data-name="${name},${sys.country}">
            <span>${name}</span>
            <sup>${sys.country}</sup>
        </h2>
        <div class="city-temp">
            ${Math.round(main.temp)}<sup>°C</sup>
        </div>
        <figure>
            <img class="city-icon" src="${iconUrl}" alt="${weather[0].description}">
            <figcaption>${weather[0].description}</figcaption>
        </figure>
    `;
    
    return li;
}

/**
 * Получает данные о погоде с API
 * @param {string} city - Название города для поиска
 */
async function fetchWeatherData(city) {
    
    if (!checkApiKey()) {
        showMessage('⚠️ Пожалуйста, укажите ваш API ключ в файле script.js', 'error');
        return null;
    }
    
    const url = `${CONFIG.API_URL}?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}`;
    
    try {
        showMessage('🔄 Загрузка данных...', 'info');
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Ошибка при получении данных');
        }
        
        return data;
        
    } catch (error) {
        console.error('Ошибка fetchWeatherData:', error);
        
        if (error.message.includes('404')) {
            showMessage('❌ Город не найден. Проверьте название.', 'error');
        } else if (error.message.includes('401')) {
            showMessage('❌ Ошибка авторизации API. Проверьте ключ.', 'error');
        } else {
            showMessage(`❌ Ошибка: ${error.message}`, 'error');
        }
        
        return null;
    }
}

/**
 * Обработчик отправки формы
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const inputVal = elements.input.value.trim();
    
    if (!inputVal) {
        showMessage('❌ Пожалуйста, введите название города', 'error');
        return;
    }
    
    const weatherData = await fetchWeatherData(inputVal);
    
    if (!weatherData) {
        elements.input.value = '';
        elements.input.focus();
        return;
    }
    
    const { name, sys } = weatherData;
    
    if (isCityDuplicate(name, sys.country)) {
        showMessage(
            `ℹ️ Погода для города ${name}, ${sys.country} уже отображается. ` +
            `Для другого города укажите код страны (например: ${name},${sys.country === 'US' ? 'GB' : 'US'})`,
            'info'
        );
        elements.form.reset();
        elements.input.focus();
        return;
    }
    
    const cityCard = createCityCard(weatherData);
    elements.list.appendChild(cityCard);
    
    cityCard.style.animation = 'fadeIn 0.5s ease';
    
    showMessage(`✅ Погода для ${name}, ${sys.country} успешно загружена!`, 'info');
    
    elements.form.reset();
    elements.input.focus();
}

/**
 * Запускает приложение
 */
function initApp() {
    if (!elements.form || !elements.input || !elements.msg || !elements.list) {
        console.error('❌ Ошибка: Не все необходимые элементы найдены в DOM');
        return;
    }
    
    elements.form.addEventListener('submit', handleFormSubmit);
    
    checkApiKey();
    
    showMessage(CONFIG.DEFAULT_MESSAGE, 'info');
    
    console.log('✅ Приложение успешно запущено!');
}

document.addEventListener('DOMContentLoaded', initApp);