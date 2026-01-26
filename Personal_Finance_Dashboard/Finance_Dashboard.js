// ==================== STATE MANAGEMENT ====================
class FinanceState {
  constructor() {
    this.accounts = this.loadAccounts();
    this.transactions = this.loadTransactions();
    this.budgets = this.loadBudgets();
    this.goals = this.loadGoals();
    this.settings = this.loadSettings();
  }

  loadAccounts() {
    const saved = localStorage.getItem("accounts");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            name: "Checking",
            type: "Checking Account",
            balance: 5250.0,
          },
          { id: 2, name: "Savings", type: "Savings Account", balance: 12500.0 },
          { id: 3, name: "Credit Card", type: "Credit Card", balance: -450.0 },
        ];
  }

  saveAccounts() {
    localStorage.setItem("accounts", JSON.stringify(this.accounts));
  }

  loadTransactions() {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : this.getDefaultTransactions();
  }

  getDefaultTransactions() {
    const today = new Date();
    return [
      {
        id: 1,
        description: "Salary Deposit",
        category: "salary",
        type: "income",
        amount: 4500,
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        balance: 15000,
      },
      {
        id: 2,
        description: "Coffee Shop",
        category: "food",
        type: "expense",
        amount: 6.5,
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        balance: 14993.5,
      },
      {
        id: 3,
        description: "Grocery Store",
        category: "food",
        type: "expense",
        amount: 85.3,
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        balance: 14908.2,
      },
      {
        id: 4,
        description: "Gas Station",
        category: "transport",
        type: "expense",
        amount: 45.0,
        date: today.toISOString(),
        balance: 14863.2,
      },
      {
        id: 5,
        description: "Netflix Subscription",
        category: "entertainment",
        type: "expense",
        amount: 15.99,
        date: today.toISOString(),
        balance: 14847.21,
      },
    ];
  }

  saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(this.transactions));
  }

  loadBudgets() {
    const saved = localStorage.getItem("budgets");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            category: "food",
            name: "Food & Dining",
            limit: 500,
            spent: 91.8,
          },
          {
            id: 2,
            category: "transport",
            name: "Transport",
            limit: 200,
            spent: 45.0,
          },
          {
            id: 3,
            category: "entertainment",
            name: "Entertainment",
            limit: 150,
            spent: 15.99,
          },
          {
            id: 4,
            category: "utilities",
            name: "Utilities",
            limit: 300,
            spent: 0,
          },
        ];
  }

  saveBudgets() {
    localStorage.setItem("budgets", JSON.stringify(this.budgets));
  }

  loadGoals() {
    const saved = localStorage.getItem("goals");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            name: "Emergency Fund",
            target: 10000,
            saved: 7500,
            emoji: "🏦",
          },
          { id: 2, name: "Vacation", target: 3000, saved: 1250, emoji: "✈️" },
          { id: 3, name: "New Laptop", target: 1500, saved: 450, emoji: "💻" },
        ];
  }

  saveGoals() {
    localStorage.setItem("goals", JSON.stringify(this.goals));
  }

  loadSettings() {
    const saved = localStorage.getItem("settings");
    return saved
      ? JSON.parse(saved)
      : {
          currency: "USD",
          theme: "light",
          notifications: true,
        };
  }

  saveSettings() {
    localStorage.setItem("settings", JSON.stringify(this.settings));
  }
}

// ==================== FINANCE DASHBOARD ====================
class FinanceDashboard {
  constructor() {
    this.state = new FinanceState();
    this.charts = {};
    this.initElements();
    this.setupEventListeners();
    this.render();
  }

  initElements() {
    this.elements = {
      // Navigation
      navItems: document.querySelectorAll(".nav-item"),
      menuToggle: document.getElementById("menuToggle"),
      sidebar: document.querySelector(".sidebar"),

      // Sections
      dashboardSection: document.getElementById("dashboardSection"),
      transactionsSection: document.getElementById("transactionsSection"),
      budgetSection: document.getElementById("budgetSection"),
      goalsSection: document.getElementById("goalsSection"),
      analyticsSection: document.getElementById("analyticsSection"),

      // Metrics
      totalBalance: document.getElementById("totalBalance"),
      totalIncome: document.getElementById("totalIncome"),
      totalExpenses: document.getElementById("totalExpenses"),
      savingsRate: document.getElementById("savingsRate"),

      // Lists
      recentTransactions: document.getElementById("recentTransactions"),
      accountsList: document.getElementById("accountsList"),
      recentTransactionsTable: document.getElementById("transactionsTableBody"),

      // Buttons
      addTransactionBtn: document.getElementById("addTransactionBtn"),
      addAccountBtn: document.getElementById("addAccountBtn"),
      addBudgetBtn: document.getElementById("addBudgetBtn"),
      addGoalBtn: document.getElementById("addGoalBtn"),

      // Modal
      transactionModal: document.getElementById("transactionModal"),
      closeTransactionModal: document.getElementById("closeTransactionModal"),
      transactionForm: document.getElementById("transactionForm"),

      // Other
      toast: document.getElementById("toast"),
      pageTitle: document.getElementById("pageTitle"),
      pageSubtitle: document.getElementById("pageSubtitle"),
    };
  }

  setupEventListeners() {
    // Navigation
    this.elements.navItems.forEach((item) => {
      item.addEventListener("click", (e) => this.switchSection(e));
    });
    this.elements.menuToggle.addEventListener("click", () =>
      this.toggleSidebar(),
    );

    // Buttons
    this.elements.addTransactionBtn?.addEventListener("click", () =>
      this.openTransactionModal(),
    );
    this.elements.addBudgetBtn?.addEventListener("click", () =>
      this.addBudgetPrompt(),
    );
    this.elements.addGoalBtn?.addEventListener("click", () =>
      this.addGoalPrompt(),
    );

    // Modal
    this.elements.closeTransactionModal?.addEventListener("click", () =>
      this.closeTransactionModal(),
    );
    this.elements.transactionModal?.addEventListener("click", (e) => {
      if (e.target === this.elements.transactionModal) {
        this.closeTransactionModal();
      }
    });
    this.elements.transactionForm?.addEventListener("submit", (e) =>
      this.handleTransactionSubmit(e),
    );

    // Charts
    const expenseFilter = document.getElementById("expenseFilter");
    const incomeExpenseFilter = document.getElementById("incomeExpenseFilter");
    expenseFilter?.addEventListener("change", () => this.updateExpenseChart());
    incomeExpenseFilter?.addEventListener("change", () =>
      this.updateIncomeExpenseChart(),
    );

    // Close sidebar on mobile when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".sidebar") && !e.target.closest(".menu-toggle")) {
        this.elements.sidebar?.classList.remove("active");
      }
    });
  }

  switchSection(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;

    // Update nav items
    this.elements.navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.section === section);
    });

    // Hide all sections
    this.elements.dashboardSection.style.display = "none";
    this.elements.transactionsSection.style.display = "none";
    this.elements.budgetSection.style.display = "none";
    this.elements.goalsSection.style.display = "none";
    this.elements.analyticsSection.style.display = "none";

    // Show selected section
    switch (section) {
      case "dashboard":
        this.elements.dashboardSection.style.display = "block";
        this.elements.pageTitle.textContent = "Dashboard";
        this.elements.pageSubtitle.textContent =
          "Welcome back! Here's your financial overview.";
        break;
      case "transactions":
        this.elements.transactionsSection.style.display = "block";
        this.elements.pageTitle.textContent = "Transactions";
        this.elements.pageSubtitle.textContent =
          "Manage and track all your financial transactions";
        this.renderTransactionsTable();
        break;
      case "budget":
        this.elements.budgetSection.style.display = "block";
        this.elements.pageTitle.textContent = "Budget";
        this.elements.pageSubtitle.textContent =
          "Set and track spending limits by category";
        this.renderBudgets();
        break;
      case "goals":
        this.elements.goalsSection.style.display = "block";
        this.elements.pageTitle.textContent = "Goals";
        this.elements.pageSubtitle.textContent =
          "Track your savings goals and milestones";
        this.renderGoals();
        break;
      case "analytics":
        this.elements.analyticsSection.style.display = "block";
        this.elements.pageTitle.textContent = "Analytics";
        this.elements.pageSubtitle.textContent =
          "Deep insights into your spending patterns";
        this.initAnalyticsCharts();
        break;
    }

    // Close sidebar on mobile
    this.elements.sidebar?.classList.remove("active");
  }

  toggleSidebar() {
    this.elements.sidebar?.classList.toggle("active");
  }

  render() {
    this.updateMetrics();
    this.renderRecentTransactions();
    this.renderAccounts();
    this.initCharts();
  }

  updateMetrics() {
    // Calculate metrics
    const accounts = this.state.accounts;
    const transactions = this.state.transactions;

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const savingsRate =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
        : 0;

    // Update UI
    this.elements.totalBalance.textContent = this.formatCurrency(totalBalance);
    this.elements.totalIncome.textContent = this.formatCurrency(totalIncome);
    this.elements.totalExpenses.textContent =
      this.formatCurrency(totalExpenses);
    this.elements.savingsRate.textContent = `${savingsRate}%`;
  }

  renderRecentTransactions() {
    const recent = this.state.transactions.slice(0, 5);
    this.elements.recentTransactions.innerHTML = recent
      .map(
        (tx) => `
            <div class="transaction-item">
                <div class="transaction-icon">${this.getCategoryIcon(tx.category)}</div>
                <div class="transaction-details">
                    <div class="transaction-description">${tx.description}</div>
                    <div class="transaction-category">${tx.category}</div>
                </div>
                <div class="transaction-amount ${tx.type}">
                    ${tx.type === "income" ? "+" : "-"}${this.formatCurrency(tx.amount)}
                </div>
            </div>
        `,
      )
      .join("");
  }

  renderAccounts() {
    this.elements.accountsList.innerHTML = this.state.accounts
      .map(
        (acc) => `
            <div class="account-item">
                <div class="account-name">${acc.name}</div>
                <div class="account-type">${acc.type}</div>
                <div class="account-balance">${this.formatCurrency(acc.balance)}</div>
            </div>
        `,
      )
      .join("");
  }

  renderTransactionsTable() {
    const transactions = this.state.transactions.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    this.elements.recentTransactionsTable.innerHTML = transactions
      .map(
        (tx) => `
            <tr>
                <td>${new Date(tx.date).toLocaleDateString()}</td>
                <td>${tx.description}</td>
                <td>${tx.category}</td>
                <td>${tx.type === "income" ? "✓ Income" : "✗ Expense"}</td>
                <td class="${tx.type}">${tx.type === "income" ? "+" : "-"}${this.formatCurrency(tx.amount)}</td>
                <td>${this.formatCurrency(tx.balance)}</td>
                <td>
                    <button class="action-btn" onclick="dashboard.deleteTransaction(${tx.id})">Delete</button>
                </td>
            </tr>
        `,
      )
      .join("");
  }

  renderBudgets() {
    const budgetGrid = document.getElementById("budgetGrid");
    budgetGrid.innerHTML = this.state.budgets
      .map((budget) => {
        const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
        return `
                <div class="budget-card">
                    <div class="budget-header">
                        <div class="budget-name">${budget.name}</div>
                        <button class="budget-delete" onclick="dashboard.deleteBudget(${budget.id})">×</button>
                    </div>
                    <div class="budget-amount">
                        <span class="budget-spent">${this.formatCurrency(budget.spent)} spent</span>
                        <span class="budget-limit">of ${this.formatCurrency(budget.limit)}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="budget-bar" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  renderGoals() {
    const goalsGrid = document.getElementById("goalsGrid");
    goalsGrid.innerHTML = this.state.goals
      .map((goal) => {
        const percentage = Math.min((goal.saved / goal.target) * 100, 100);
        return `
                <div class="goal-card">
                    <div class="goal-icon">${goal.emoji}</div>
                    <div class="goal-name">${goal.name}</div>
                    <div class="goal-target">Target: ${this.formatCurrency(goal.target)}</div>
                    <div class="goal-amount">
                        <span class="goal-saved">${this.formatCurrency(goal.saved)}</span>
                        <span class="goal-target-amount">/ ${this.formatCurrency(goal.target)}</span>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-bar" style="width: ${percentage}%"></div>
                    </div>
                    <div class="goal-percentage">${Math.round(percentage)}% Complete</div>
                </div>
            `;
      })
      .join("");
  }

  openTransactionModal() {
    this.elements.transactionModal.classList.add("active");
    document.getElementById("txDate").valueAsDate = new Date();
  }

  closeTransactionModal() {
    this.elements.transactionModal.classList.remove("active");
    this.elements.transactionForm.reset();
  }

  handleTransactionSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.elements.transactionForm);
    const transaction = {
      id: Date.now(),
      description: document.getElementById("txDescription").value,
      category: document.getElementById("txCategory").value,
      type: formData.get("type"),
      amount: parseFloat(document.getElementById("txAmount").value),
      date: document.getElementById("txDate").value,
      balance: this.state.accounts[0].balance, // Simplified
    };

    this.state.transactions.unshift(transaction);
    this.state.saveTransactions();

    // Update account balance
    const changeAmount =
      transaction.type === "income" ? transaction.amount : -transaction.amount;
    this.state.accounts[0].balance += changeAmount;
    this.state.saveAccounts();

    this.closeTransactionModal();
    this.render();
    this.showToast(`Transaction added successfully!`);
  }

  deleteTransaction(id) {
    this.state.transactions = this.state.transactions.filter(
      (t) => t.id !== id,
    );
    this.state.saveTransactions();
    this.renderTransactionsTable();
    this.updateMetrics();
    this.showToast("Transaction deleted");
  }

  addBudgetPrompt() {
    const name = prompt("Budget name:");
    if (!name) return;
    const limit = parseFloat(prompt("Budget limit:"));
    if (!limit) return;

    const budget = {
      id: Date.now(),
      category: "other",
      name,
      limit,
      spent: 0,
    };

    this.state.budgets.push(budget);
    this.state.saveBudgets();
    this.renderBudgets();
    this.showToast("Budget added successfully!");
  }

  deleteBudget(id) {
    this.state.budgets = this.state.budgets.filter((b) => b.id !== id);
    this.state.saveBudgets();
    this.renderBudgets();
    this.showToast("Budget deleted");
  }

  addGoalPrompt() {
    const name = prompt("Goal name:");
    if (!name) return;
    const target = parseFloat(prompt("Target amount:"));
    if (!target) return;

    const goal = {
      id: Date.now(),
      name,
      target,
      saved: 0,
      emoji: "🎯",
    };

    this.state.goals.push(goal);
    this.state.saveGoals();
    this.renderGoals();
    this.showToast("Goal added successfully!");
  }

  showToast(message) {
    this.elements.toast.textContent = message;
    this.elements.toast.classList.add("show");
    setTimeout(() => {
      this.elements.toast.classList.remove("show");
    }, 3000);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  getCategoryIcon(category) {
    const icons = {
      salary: "💼",
      food: "🍔",
      transport: "🚗",
      utilities: "💡",
      entertainment: "🎬",
      other: "📌",
    };
    return icons[category] || "💰";
  }

  // Charts
  initCharts() {
    this.initExpenseChart();
    this.initIncomeExpenseChart();
  }

  initExpenseChart() {
    const ctx = document.getElementById("expenseChart");
    if (!ctx) return;

    const categories = {};
    this.state.transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    const labels = Object.keys(categories);
    const data = Object.values(categories);
    const colors = [
      "rgba(13, 148, 136, 0.8)",
      "rgba(59, 130, 246, 0.8)",
      "rgba(139, 92, 246, 0.8)",
      "rgba(245, 158, 11, 0.8)",
    ];

    if (this.charts.expense) {
      this.charts.expense.destroy();
    }

    this.charts.expense = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  initIncomeExpenseChart() {
    const ctx = document.getElementById("incomeExpenseChart");
    if (!ctx) return;

    // Simplified: Last 6 months
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString("default", { month: "short" });
      months.push(monthName);

      const monthTransactions = this.state.transactions.filter((t) => {
        const tDate = new Date(t.date);
        return (
          tDate.getMonth() === date.getMonth() &&
          tDate.getFullYear() === date.getFullYear()
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      incomeData.push(income);
      expenseData.push(expense);
    }

    if (this.charts.incomeExpense) {
      this.charts.incomeExpense.destroy();
    }

    this.charts.incomeExpense = new Chart(ctx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            backgroundColor: "rgba(16, 185, 129, 0.8)",
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: "Expenses",
            data: expenseData,
            backgroundColor: "rgba(239, 68, 68, 0.8)",
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  initAnalyticsCharts() {
    this.initSpendingTrendsChart();
    this.initCategoryDistributionChart();
    this.initCashFlowChart();
  }

  initSpendingTrendsChart() {
    const ctx = document.getElementById("spendingTrendsChart");
    if (!ctx || this.charts.spendingTrends) return;

    const weeks = [];
    const weeklySpending = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      weeks.push(`Week ${12 - i}`);

      const weekTransactions = this.state.transactions.filter((t) => {
        const tDate = new Date(t.date);
        return Math.abs((tDate - date) / (7 * 24 * 60 * 60 * 1000)) < 1;
      });

      const spending = weekTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      weeklySpending.push(spending);
    }

    this.charts.spendingTrends = new Chart(ctx, {
      type: "line",
      data: {
        labels: weeks,
        datasets: [
          {
            label: "Weekly Spending",
            data: weeklySpending,
            borderColor: "rgba(13, 148, 136, 1)",
            backgroundColor: "rgba(13, 148, 136, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "rgba(13, 148, 136, 1)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  initCategoryDistributionChart() {
    const ctx = document.getElementById("categoryDistributionChart");
    if (!ctx || this.charts.categoryDistribution) return;

    const categories = {};
    this.state.transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    this.charts.categoryDistribution = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [
          {
            data: Object.values(categories),
            backgroundColor: [
              "rgba(13, 148, 136, 0.8)",
              "rgba(59, 130, 246, 0.8)",
              "rgba(139, 92, 246, 0.8)",
              "rgba(245, 158, 11, 0.8)",
            ],
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
          },
        },
      },
    });
  }

  initCashFlowChart() {
    const ctx = document.getElementById("cashFlowChart");
    if (!ctx || this.charts.cashFlow) return;

    const months = [];
    const cashFlowData = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString("default", { month: "short" });
      months.push(monthName);

      const monthTransactions = this.state.transactions.filter((t) => {
        const tDate = new Date(t.date);
        return (
          tDate.getMonth() === date.getMonth() &&
          tDate.getFullYear() === date.getFullYear()
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      cashFlowData.push(income - expense);
    }

    this.charts.cashFlow = new Chart(ctx, {
      type: "area",
      data: {
        labels: months,
        datasets: [
          {
            label: "Net Cash Flow",
            data: cashFlowData,
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  updateExpenseChart() {
    this.initExpenseChart();
  }

  updateIncomeExpenseChart() {
    this.initIncomeExpenseChart();
  }
}

// ==================== INITIALIZATION ====================
let dashboard;

document.addEventListener("DOMContentLoaded", () => {
  dashboard = new FinanceDashboard();
  console.log("💰 WealthFlow Finance Dashboard Initialized");
});
