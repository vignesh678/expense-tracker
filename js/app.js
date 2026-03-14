/* ============================================================
   app.js — Application initialisation & navigation
   ============================================================ */

const App = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  currentView: 'dashboard',

  init() {
    // Populate dropdowns
    UI.populateCategoryDropdowns();

    // Initialize custom date pickers
    DatePicker.create('expense-datepicker');
    DatePicker.create('edit-datepicker');

    // Set default date to today
    DatePicker.setToday('expense-date');

    // Update month labels
    UI.updateMonthLabels(this.currentMonth, this.currentYear);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const view = link.dataset.view;
        this.navigateTo(view);
      });
    });

    // Month navigation — Dashboard
    document.getElementById('dash-prev-month').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('dash-next-month').addEventListener('click', () => this.changeMonth(1));

    // Month navigation — List
    document.getElementById('list-prev-month').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('list-next-month').addEventListener('click', () => this.changeMonth(1));

    // Month navigation — Report
    document.getElementById('report-prev-month').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('report-next-month').addEventListener('click', () => this.changeMonth(1));

    // Add expense form
    document.getElementById('expense-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddExpense();
    });

    // Edit form
    document.getElementById('edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditExpense();
    });

    // Modal close
    document.getElementById('modal-close-btn').addEventListener('click', () => UI.closeEditModal());
    document.getElementById('modal-cancel-btn').addEventListener('click', () => UI.closeEditModal());
    document.getElementById('edit-modal').addEventListener('click', (e) => {
      if (e.target.id === 'edit-modal') UI.closeEditModal();
    });

    // Export CSV
    document.getElementById('export-csv-btn').addEventListener('click', () => {
      Export.download(this.currentMonth, this.currentYear);
    });

    // Mobile toggle
    document.getElementById('mobileToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar on mobile when navigating
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          document.getElementById('sidebar').classList.remove('open');
        }
      });
    });

    // Initial render
    this.refreshCurrentView();
  },

  navigateTo(view) {
    this.currentView = view;

    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.view === view);
    });

    // Show/hide views
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === `view-${view}`);
    });

    this.refreshCurrentView();
  },

  changeMonth(delta) {
    this.currentMonth += delta;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    UI.updateMonthLabels(this.currentMonth, this.currentYear);
    this.refreshCurrentView();
  },

  refreshCurrentView() {
    const summary = Storage.getMonthlySummary(this.currentMonth, this.currentYear);

    switch (this.currentView) {
      case 'dashboard':
        UI.renderSummaryCards('summary-cards', summary);
        Charts.drawPie('pieChart', summary.byCategory, 'pieLegend');
        Charts.drawBar('barChart', summary.byDay, this.currentMonth, this.currentYear);
        UI.renderRecentTransactions(summary.expenses);
        break;

      case 'list':
        UI.renderExpenseTable('expense-table-wrapper', summary.expenses, true);
        break;

      case 'report':
        UI.renderSummaryCards('report-summary-cards', summary);
        UI.renderCategoryBreakdown('report-category-table', summary.byCategory, summary.total);
        UI.renderExpenseTable('report-transactions-table', summary.expenses, false);
        break;
    }
  },

  handleAddExpense() {
    const date = DatePicker.getISOValue('expense-date');
    const category = document.getElementById('expense-category').value;
    const amount = document.getElementById('expense-amount').value;
    const note = document.getElementById('expense-note').value;

    if (!date || !category || !amount || parseFloat(amount) <= 0) {
      UI.showToast('Please fill all required fields.', 'error');
      return;
    }

    Storage.addExpense({ date, category, amount, note });
    UI.showToast('Expense added successfully!', 'success');

    // Reset form
    document.getElementById('expense-form').reset();
    DatePicker.setToday('expense-date');

    // Update the selected month to the expense's month so user sees it
    const d = new Date(date);
    this.currentMonth = d.getMonth();
    this.currentYear = d.getFullYear();
    UI.updateMonthLabels(this.currentMonth, this.currentYear);

    // Navigate to dashboard
    this.navigateTo('dashboard');
  },

  handleEditExpense() {
    const id = document.getElementById('edit-id').value;
    const date = DatePicker.getISOValue('edit-date');
    const category = document.getElementById('edit-category').value;
    const amount = document.getElementById('edit-amount').value;
    const note = document.getElementById('edit-note').value;

    if (!date || !category || !amount || parseFloat(amount) <= 0) {
      UI.showToast('Please fill all required fields.', 'error');
      return;
    }

    Storage.editExpense(id, { date, category, amount, note });
    UI.closeEditModal();
    UI.showToast('Expense updated!', 'success');
    this.refreshCurrentView();
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
