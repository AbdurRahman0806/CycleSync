document.addEventListener('DOMContentLoaded', () => {
    const cycleStartInput = document.getElementById('cycleStart');
    const cycleLengthInput = document.getElementById('cycleLength');
    const downloadBtn = document.getElementById('downloadBtn');
    const predictionsContainer = document.getElementById('predictions');
    const calendar = new Calendar(document.getElementById('calendar'));

    // Set default date to today
    const today = new Date();
    cycleStartInput.value = today.toISOString().split('T')[0];

    const updatePredictions = (cycleStartDate, cycleLength) => {
        const predictions = generateFutureMonths(cycleStartDate, cycleLength);
        predictionsContainer.innerHTML = '<h2>3-Month Prediction</h2>';

        predictions.forEach(month => {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'month-prediction';
            
            monthDiv.innerHTML = `
                <h3>${month.month}</h3>
                <div class="prediction-dates">
                    ${month.dates.map(date => `
                        <span class="prediction-date ${date.phase}">
                            ${date.date} - ${date.phase}
                        </span>
                    `).join('')}
                </div>
            `;
            
            predictionsContainer.appendChild(monthDiv);
        });

        return predictions;
    };

    const updateCalendar = () => {
        const cycleStartDate = new Date(cycleStartInput.value);
        const cycleLength = parseInt(cycleLengthInput.value, 10);
        
        calendar.render(cycleStartDate, cycleLength);
        return updatePredictions(cycleStartDate, cycleLength);
    };

    cycleStartInput.addEventListener('change', updateCalendar);
    cycleLengthInput.addEventListener('change', updateCalendar);
    
    downloadBtn.addEventListener('click', () => {
        const cycleStartDate = new Date(cycleStartInput.value);
        const cycleLength = parseInt(cycleLengthInput.value, 10);
        const predictions = generateFutureMonths(cycleStartDate, cycleLength);
        downloadCalendar(predictions);
    });

    // Initial render
    updateCalendar();
});

class Calendar {
    constructor(container) {
        this.container = container;
        this.weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }

    renderMonth(date, cycleStartDate, cycleLength) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-calendar';

        const monthHeader = document.createElement('h3');
        monthHeader.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthContainer.appendChild(monthHeader);

        const weekdaysContainer = document.createElement('div');
        weekdaysContainer.className = 'weekdays';
        this.weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'weekday';
            dayElement.textContent = day;
            weekdaysContainer.appendChild(dayElement);
        });
        monthContainer.appendChild(weekdaysContainer);

        const daysContainer = document.createElement('div');
        daysContainer.className = 'days';

        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day';
            daysContainer.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            
            const phase = calculateCyclePhase(currentDate, cycleStartDate, cycleLength);
            if (phase !== PHASES.NORMAL) {
                dayElement.classList.add(phase);
            }
            
            if (isSameDay(currentDate, new Date())) {
                dayElement.classList.add('today');
            }
            
            dayElement.textContent = day;
            daysContainer.appendChild(dayElement);
        }

        monthContainer.appendChild(daysContainer);
        return monthContainer;
    }

    render(cycleStartDate, cycleLength) {
        this.container.innerHTML = '';
        
        let currentDate = new Date();
        
        // Create container for all three months
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-grid';

        // Render next three months
        for (let i = 0; i < 3; i++) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthCalendar = this.renderMonth(monthDate, cycleStartDate, cycleLength);
            calendarContainer.appendChild(monthCalendar);
        }

        this.container.appendChild(calendarContainer);
    }
}

const PHASES = {
    PERIOD: 'period',
    PRE_PERIOD: 'pre-period',
    OVULATION: 'ovulation',
    NORMAL: 'normal'
};

const calculateCyclePhase = (date, cycleStartDate, cycleLength = 28) => {
    const dayDiff = Math.floor(
        (date.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dayInCycle = ((dayDiff % cycleLength) + cycleLength) % cycleLength;

    if (dayInCycle < 5) {
        return PHASES.PERIOD;
    } else if (dayInCycle >= cycleLength - 3) {
        return PHASES.PRE_PERIOD;
    } else if (dayInCycle >= 12 && dayInCycle <= 16) {
        return PHASES.OVULATION;
    }
    return PHASES.NORMAL;
};

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const isSameDay = (date1, date2) => {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
};

const generateCalendarHTML = (predictions) => {
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Period Calendar Predictions</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .month { margin-bottom: 20px; }
                .phase { display: inline-block; padding: 2px 6px; border-radius: 4px; margin: 2px; }
                .period { background: #fee2e2; }
                .pre-period { background: #f3e8ff; }
                .ovulation { background: #dcfce7; }
            </style>
        </head>
        <body>
            <h1>Period Calendar Predictions</h1>
    `;

    predictions.forEach(month => {
        html += `
            <div class="month">
                <h2>${month.month}</h2>
                <div class="dates">
        `;

        month.dates.forEach(date => {
            html += `
                <span class="phase ${date.phase}">
                    ${date.date} - ${date.phase}
                </span>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
        </body>
        </html>
    `;

    return html;
};

const downloadCalendar = (predictions) => {
    const html = generateCalendarHTML(predictions);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'period-calendar.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const calculateAverageCycleLength = (periodLengths) => {
    if (!periodLengths.length) return 28;
    const sum = periodLengths.reduce((acc, length) => acc + length, 0);
    return Math.round(sum / periodLengths.length);
};

const generateFutureMonths = (startDate, cycleLength, numberOfMonths = 3) => {
    const predictions = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < numberOfMonths; i++) {
        const monthData = {
            month: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
            dates: []
        };

        // Get all cycle dates for the month
        let cycleDay = 0;
        const daysInMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        ).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
            );
            const phase = calculateCyclePhase(date, startDate, cycleLength);
            if (phase !== PHASES.NORMAL) {
                monthData.dates.push({
                    date: date.getDate(),
                    phase: phase
                });
            }
        }

        predictions.push(monthData);
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return predictions;
};