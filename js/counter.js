/**
 * OmniSuite Counter Module
 * Handles counting operations, custom steps, presets, activity log, pop animations, and persistence.
 */
class Counter {
  constructor() {
    this.value = this.loadValue();
    this.step = this.loadStep();
    this.logs = this.loadLogs();

    // DOM Elements
    this.valueEl = document.getElementById('counter-value');
    this.btnDecrement = document.getElementById('counter-decrement');
    this.btnIncrement = document.getElementById('counter-increment');
    this.btnReset = document.getElementById('counter-reset');
    
    // Config / Step Elements
    this.stepInput = document.getElementById('counter-step');
    this.presetButtons = document.querySelectorAll('.btn-preset');
    this.historyListEl = document.getElementById('counter-history-list');
    this.clearLogsBtn = document.getElementById('clear-counter-history');

    this.init();
  }

  init() {
    // Increment/Decrement/Reset click
    this.btnIncrement.addEventListener('click', () => this.updateValue(this.step, 'positive'));
    this.btnDecrement.addEventListener('click', () => this.updateValue(-this.step, 'negative'));
    this.btnReset.addEventListener('click', () => this.resetCounter());

    // Step input change
    this.stepInput.addEventListener('change', () => {
      let val = parseInt(this.stepInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      this.step = val;
      this.saveStep();
      this.updatePresetButtonsHighlight();
    });

    // Preset buttons click
    this.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetVal = parseInt(btn.getAttribute('data-step'), 10);
        this.step = presetVal;
        this.stepInput.value = presetVal;
        this.saveStep();
        this.updatePresetButtonsHighlight();
      });
    });

    // Clear logs click
    this.clearLogsBtn.addEventListener('click', () => this.clearLogs());

    // Initial setups
    this.stepInput.value = this.step;
    this.updatePresetButtonsHighlight();
    this.render();
    this.renderLogs();
  }

  loadValue() {
    const stored = localStorage.getItem('omnisuite_counter_value');
    return stored !== null ? parseInt(stored, 10) : 0;
  }

  saveValue() {
    localStorage.setItem('omnisuite_counter_value', this.value.toString());
  }

  loadStep() {
    const stored = localStorage.getItem('omnisuite_counter_step');
    return stored ? parseInt(stored, 10) : 1;
  }

  saveStep() {
    localStorage.setItem('omnisuite_counter_step', this.step.toString());
  }

  loadLogs() {
    const stored = localStorage.getItem('omnisuite_counter_logs');
    return stored ? JSON.parse(stored) : [];
  }

  saveLogs() {
    localStorage.setItem('omnisuite_counter_logs', JSON.stringify(this.logs));
  }

  updateValue(delta, type) {
    this.value += delta;
    this.saveValue();
    this.triggerPopEffect();
    
    // Add log
    const changeSymbol = delta > 0 ? `+${delta}` : `${delta}`;
    this.addLog(changeSymbol, type);
    
    this.render();
  }

  resetCounter() {
    if (this.value === 0) return;
    this.value = 0;
    this.saveValue();
    this.triggerPopEffect();

    this.addLog('Reset', 'reset-op');
    this.render();
  }

  addLog(changeText, type) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    const newLog = {
      changeText: changeText,
      resultVal: this.value,
      time: timeStr,
      type: type // 'positive', 'negative', 'reset-op'
    };

    this.logs.unshift(newLog);
    if (this.logs.length > 15) this.logs.pop(); // Cap log size at 15 items
    this.saveLogs();
    this.renderLogs();
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
    this.renderLogs();
  }

  triggerPopEffect() {
    this.valueEl.classList.remove('pop');
    void this.valueEl.offsetWidth; // Trigger reflow to restart animation
    this.valueEl.classList.add('pop');
    setTimeout(() => {
      this.valueEl.classList.remove('pop');
    }, 150);
  }

  updatePresetButtonsHighlight() {
    this.presetButtons.forEach(btn => {
      const presetVal = parseInt(btn.getAttribute('data-step'), 10);
      if (presetVal === this.step) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  render() {
    this.valueEl.textContent = this.value;
  }

  renderLogs() {
    this.historyListEl.innerHTML = '';

    if (this.logs.length === 0) {
      this.historyListEl.innerHTML = `
        <div class="empty-state small-state">
          <i data-lucide="activity"></i>
          <p>No activity logged</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    this.logs.forEach(log => {
      const logItem = document.createElement('div');
      logItem.className = 'activity-item';

      let classVal = '';
      if (log.type === 'positive') classVal = 'positive';
      else if (log.type === 'negative') classVal = 'negative';
      else classVal = 'reset-op';

      logItem.innerHTML = `
        <span>
          Val: <strong>${log.resultVal}</strong> 
          (<span class="activity-val-change ${classVal}">${log.changeText}</span>)
        </span>
        <span class="activity-time">${log.time}</span>
      `;

      this.historyListEl.appendChild(logItem);
    });
  }
}
