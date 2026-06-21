/**
 * OmniSuite Calculator Module
 * Handles mathematical calculations, keyboard bindings, visual button feedback, and historical records.
 */
class Calculator {
  constructor() {
    this.currentInput = '0';
    this.expression = '';
    this.isCompleted = false;
    this.history = this.loadHistory();

    // DOM Elements
    this.outputEl = document.getElementById('calc-output');
    this.formulaEl = document.getElementById('calc-formula');
    this.historyListEl = document.getElementById('calc-history-list');
    this.clearBtnEl = document.getElementById('calc-clear-btn');
    this.clearHistoryBtnEl = document.getElementById('clear-calc-history');
    this.keypadEl = document.querySelector('.calc-keypad');

    this.init();
  }

  init() {
    // Button clicks
    this.keypadEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-key');
      if (!btn) return;
      const val = btn.getAttribute('data-val');
      this.handleInput(val);
    });

    // Clear whole display C button (top-right next to title)
    this.clearBtnEl.addEventListener('click', () => this.clearAll());

    // Clear history list button
    this.clearHistoryBtnEl.addEventListener('click', () => this.clearHistory());

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      const calcView = document.getElementById('calculator-view');
      if (!calcView || !calcView.classList.contains('active')) return;

      let key = e.key;

      // Handle custom mapping
      if (key === 'Enter') key = '=';
      else if (key === 'Escape') key = 'C';
      else if (key === 'Delete') key = 'C';
      else if (key === 'Backspace') key = 'backspace';
      else if (key === '*') key = '*';
      else if (key === '/') key = '/';
      else if (key === '+') key = '+';
      else if (key === '-') key = '-';
      else if (key === '%') key = '%';

      // Select corresponding button and trigger click effect
      const button = this.keypadEl.querySelector(`.calc-key[data-val="${key}"]`);
      if (button) {
        e.preventDefault();
        button.classList.add('active');
        this.handleInput(key);
        setTimeout(() => button.classList.remove('active'), 100);
      }
    });

    this.render();
    this.renderHistory();
  }

  handleInput(val) {
    if (val === 'C') {
      this.clearAll();
      return;
    }

    if (val === 'backspace') {
      this.backspace();
      return;
    }

    if (val === 'pm') {
      this.toggleSign();
      return;
    }

    if (val === '=') {
      this.evaluate();
      return;
    }

    if (val === '%') {
      this.inputPercentage();
      return;
    }

    // Operator input
    if (['+', '-', '*', '/'].includes(val)) {
      this.inputOperator(val);
      return;
    }

    // Number or decimal input
    this.inputDigit(val);
  }

  clearAll() {
    this.currentInput = '0';
    this.expression = '';
    this.isCompleted = false;
    this.render();
  }

  backspace() {
    if (this.isCompleted) {
      this.clearAll();
      return;
    }

    if (this.currentInput.length > 1) {
      this.currentInput = this.currentInput.slice(0, -1);
    } else {
      this.currentInput = '0';
    }
    this.render();
  }

  toggleSign() {
    if (this.currentInput === '0') return;

    if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.slice(1);
    } else {
      this.currentInput = '-' + this.currentInput;
    }
    this.render();
  }

  inputPercentage() {
    if (this.isCompleted) {
      this.isCompleted = false;
    }

    if (this.currentInput !== '0') {
      // Direct division of currentInput by 100
      const value = parseFloat(this.currentInput) / 100;
      this.currentInput = this.formatResult(value);
      this.render();
    }
  }

  inputDigit(digit) {
    if (this.isCompleted) {
      this.currentInput = '0';
      this.isCompleted = false;
    }

    if (digit === '.') {
      if (this.currentInput.includes('.')) return;
      this.currentInput += '.';
    } else {
      if (this.currentInput === '0') {
        this.currentInput = digit;
      } else {
        this.currentInput += digit;
      }
    }
    this.render();
  }

  inputOperator(op) {
    if (this.isCompleted) {
      this.expression = this.currentInput;
      this.isCompleted = false;
    } else {
      if (this.expression === '' || this.isLastCharOperator()) {
        // Build or replace operators
        if (this.currentInput !== '0') {
          this.expression += ' ' + this.currentInput;
        }
      } else {
        this.expression += ' ' + this.currentInput;
      }
    }

    // If last token was already an operator, replace it, otherwise append
    const trimmedExpr = this.expression.trim();
    const tokens = trimmedExpr.split(' ');
    const lastToken = tokens[tokens.length - 1];

    if (['+', '-', '*', '/'].includes(lastToken)) {
      tokens[tokens.length - 1] = op;
      this.expression = tokens.join(' ');
    } else {
      this.expression = trimmedExpr + ' ' + op;
    }

    this.currentInput = '0';
    this.render();
  }

  isLastCharOperator() {
    const trimmed = this.expression.trim();
    if (!trimmed) return false;
    const last = trimmed[trimmed.length - 1];
    return ['+', '-', '*', '/'].includes(last);
  }

  evaluate() {
    if (this.isCompleted) return;

    let fullExpression = this.expression;
    if (this.currentInput !== '0' || !this.isLastCharOperator()) {
      fullExpression += ' ' + this.currentInput;
    }

    fullExpression = fullExpression.trim();
    if (!fullExpression) return;

    // Check if it ends with an operator and clean it
    const tokens = fullExpression.split(' ');
    if (['+', '-', '*', '/'].includes(tokens[tokens.length - 1])) {
      tokens.pop();
      fullExpression = tokens.join(' ');
    }

    try {
      // Validate using strict regex to prevent code injection
      const sanitized = fullExpression.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-');
      if (!/^[0-9+\-*/.%\s()]+$/.test(sanitized)) {
        throw new Error("Invalid expression");
      }

      // Safe evaluation
      const rawResult = new Function(`return (${sanitized})`)();
      
      if (!isFinite(rawResult)) {
        this.outputEl.textContent = 'Error';
        this.currentInput = '0';
        this.expression = '';
        this.isCompleted = true;
        return;
      }

      const formattedResult = this.formatResult(rawResult);

      // Save to History (only if expression contains an operator)
      const hasOperator = /[\+\-\*\/]/.test(fullExpression);
      if (hasOperator) {
        const historyItem = {
          formula: this.formatDisplayFormula(fullExpression),
          result: formattedResult
        };
        
        this.history.unshift(historyItem);
        if (this.history.length > 20) this.history.pop(); // Cap history items at 20
        this.saveHistory();
      }

      // Update States
      this.currentInput = formattedResult;
      this.expression = '';
      this.isCompleted = true;

      this.render();
      this.renderHistory();

    } catch (err) {
      console.error(err);
      this.outputEl.textContent = 'Error';
      this.currentInput = '0';
      this.expression = '';
      this.isCompleted = true;
    }
  }

  formatResult(num) {
    if (isNaN(num)) return 'Error';
    
    // Avoid decimal precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
    // Standard floating-point tolerance check
    const precision = 12;
    const multiplier = Math.pow(10, precision);
    const rounded = Math.round(num * multiplier) / multiplier;
    
    const str = rounded.toString();
    if (str.length > 12) {
      // Use scientific notation for very large/small numbers
      return rounded.toExponential(6);
    }
    return str;
  }

  formatDisplayFormula(expr) {
    return expr
      .replace(/\//g, ' ÷ ')
      .replace(/\*/g, ' × ')
      .replace(/\+/g, ' + ')
      .replace(/\-/g, ' − ');
  }

  render() {
    this.outputEl.textContent = this.currentInput;
    this.formulaEl.textContent = this.formatDisplayFormula(this.expression);
  }

  // History operations
  loadHistory() {
    const stored = localStorage.getItem('omnisuite_calc_history');
    return stored ? JSON.parse(stored) : [];
  }

  saveHistory() {
    localStorage.setItem('omnisuite_calc_history', JSON.stringify(this.history));
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    this.renderHistory();
  }

  renderHistory() {
    this.historyListEl.innerHTML = '';
    
    if (this.history.length === 0) {
      this.historyListEl.innerHTML = `
        <div class="empty-state">
          <i data-lucide="history"></i>
          <p>No calculation history yet</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    this.history.forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item';
      
      row.innerHTML = `
        <span class="history-formula">${item.formula} =</span>
        <span class="history-result">${item.result}</span>
      `;

      // Click to load history calculation back into display
      row.addEventListener('click', () => {
        this.currentInput = item.result;
        this.expression = '';
        this.isCompleted = false;
        this.render();
      });

      this.historyListEl.appendChild(row);
    });
  }
}
