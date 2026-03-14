/* ============================================================
   datepicker.js — Custom futuristic calendar date picker
   Supports both manual DD/MM/YYYY typing and calendar click
   ============================================================ */

const DatePicker = {
  instances: [],

  create(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return null;

    const input = wrapper.querySelector('.datepicker-input');
    const toggleBtn = wrapper.querySelector('.datepicker-toggle');
    const dropdown = wrapper.querySelector('.datepicker-dropdown');

    const instance = {
      wrapperId,
      input,
      toggleBtn,
      dropdown,
      isOpen: false,
      viewMonth: new Date().getMonth(),
      viewYear: new Date().getFullYear(),
      selectedDate: null,
    };

    // Toggle calendar on button click
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (instance.isOpen) {
        this.close(instance);
      } else {
        this.open(instance);
      }
    });

    // Manual typing — accept DD/MM/YYYY or YYYY-MM-DD
    input.addEventListener('input', () => {
      const val = input.value.trim();
      const parsed = this.parseInput(val);
      if (parsed) {
        instance.selectedDate = parsed;
        instance.viewMonth = parsed.getMonth();
        instance.viewYear = parsed.getFullYear();
        if (instance.isOpen) this.renderCalendar(instance);
      }
    });

    // Open calendar on input focus (optional — user can also click the icon)
    input.addEventListener('focus', () => {
      if (!instance.isOpen) this.open(instance);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (instance.isOpen && !wrapper.contains(e.target)) {
        this.close(instance);
      }
    });

    this.instances.push(instance);
    return instance;
  },

  parseInput(val) {
    // DD/MM/YYYY
    let match = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
      const d = parseInt(match[1]), m = parseInt(match[2]) - 1, y = parseInt(match[3]);
      const date = new Date(y, m, d);
      if (date.getDate() === d && date.getMonth() === m && date.getFullYear() === y) return date;
    }
    // YYYY-MM-DD
    match = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) {
      const y = parseInt(match[1]), m = parseInt(match[2]) - 1, d = parseInt(match[3]);
      const date = new Date(y, m, d);
      if (date.getDate() === d && date.getMonth() === m && date.getFullYear() === y) return date;
    }
    return null;
  },

  open(instance) {
    // Close all other instances
    this.instances.forEach(inst => {
      if (inst !== instance) this.close(inst);
    });

    // If input has a valid date, navigate to its month
    const parsed = this.parseInput(instance.input.value.trim());
    if (parsed) {
      instance.selectedDate = parsed;
      instance.viewMonth = parsed.getMonth();
      instance.viewYear = parsed.getFullYear();
    }

    instance.isOpen = true;
    instance.dropdown.classList.add('active');
    this.renderCalendar(instance);
  },

  close(instance) {
    instance.isOpen = false;
    instance.dropdown.classList.remove('active');
  },

  renderCalendar(instance) {
    const { dropdown, viewMonth, viewYear, selectedDate } = instance;

    const MONTH_NAMES = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const today = new Date();

    let daysHtml = DAY_HEADERS.map(d => `<div class="dp-day-header">${d}</div>`).join('');

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      daysHtml += '<div class="dp-day dp-empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
      const isSelected = selectedDate &&
        d === selectedDate.getDate() &&
        viewMonth === selectedDate.getMonth() &&
        viewYear === selectedDate.getFullYear();
      
      let cls = 'dp-day';
      if (isToday) cls += ' dp-today';
      if (isSelected) cls += ' dp-selected';

      daysHtml += `<div class="${cls}" data-day="${d}">${d}</div>`;
    }

    dropdown.innerHTML = `
      <div class="dp-header">
        <button type="button" class="dp-nav dp-prev-year" title="Previous year">«</button>
        <button type="button" class="dp-nav dp-prev-month" title="Previous month">‹</button>
        <span class="dp-month-year">${MONTH_NAMES[viewMonth]} ${viewYear}</span>
        <button type="button" class="dp-nav dp-next-month" title="Next month">›</button>
        <button type="button" class="dp-nav dp-next-year" title="Next year">»</button>
      </div>
      <div class="dp-grid">${daysHtml}</div>
      <div class="dp-footer">
        <button type="button" class="dp-today-btn">Today</button>
      </div>
    `;

    // Event: click a day
    dropdown.querySelectorAll('.dp-day:not(.dp-empty)').forEach(cell => {
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        const day = parseInt(cell.dataset.day);
        const date = new Date(viewYear, viewMonth, day);
        this.selectDate(instance, date);
      });
    });

    // Event: prev/next month
    dropdown.querySelector('.dp-prev-month').addEventListener('click', (e) => {
      e.stopPropagation();
      instance.viewMonth--;
      if (instance.viewMonth < 0) { instance.viewMonth = 11; instance.viewYear--; }
      this.renderCalendar(instance);
    });
    dropdown.querySelector('.dp-next-month').addEventListener('click', (e) => {
      e.stopPropagation();
      instance.viewMonth++;
      if (instance.viewMonth > 11) { instance.viewMonth = 0; instance.viewYear++; }
      this.renderCalendar(instance);
    });

    // Event: prev/next year
    dropdown.querySelector('.dp-prev-year').addEventListener('click', (e) => {
      e.stopPropagation();
      instance.viewYear--;
      this.renderCalendar(instance);
    });
    dropdown.querySelector('.dp-next-year').addEventListener('click', (e) => {
      e.stopPropagation();
      instance.viewYear++;
      this.renderCalendar(instance);
    });

    // Event: today button
    dropdown.querySelector('.dp-today-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectDate(instance, new Date());
    });
  },

  selectDate(instance, date) {
    instance.selectedDate = date;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    instance.input.value = `${dd}/${mm}/${yyyy}`;
    this.close(instance);
  },

  /* Get ISO date string (YYYY-MM-DD) from input — used by app.js */
  getISOValue(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return '';
    const val = input.value.trim();
    const parsed = this.parseInput(val);
    if (parsed) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  },

  /* Set date from ISO string (YYYY-MM-DD) — used when populating edit form */
  setFromISO(inputId, isoStr) {
    const input = document.getElementById(inputId);
    if (!input || !isoStr) return;
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      input.value = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  },

  /* Set to today's date */
  setToday(inputId) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const input = document.getElementById(inputId);
    if (input) input.value = `${dd}/${mm}/${yyyy}`;
  },
};
