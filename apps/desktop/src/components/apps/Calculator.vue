<template>
  <div class="calculator">
    <div class="calculator-display">
      <div class="calculation">{{ calculation }}</div>
      <div class="result">{{ display }}</div>
    </div>
    
    <div class="calculator-buttons">
      <button @click="clear" class="btn btn-clear">C</button>
      <button @click="clearEntry" class="btn btn-clear">CE</button>
      <button @click="backspace" class="btn btn-clear">⌫</button>
      <button @click="operate('/')" class="btn btn-operator">÷</button>
      
      <button @click="inputNumber('7')" class="btn btn-number">7</button>
      <button @click="inputNumber('8')" class="btn btn-number">8</button>
      <button @click="inputNumber('9')" class="btn btn-number">9</button>
      <button @click="operate('*')" class="btn btn-operator">×</button>
      
      <button @click="inputNumber('4')" class="btn btn-number">4</button>
      <button @click="inputNumber('5')" class="btn btn-number">5</button>
      <button @click="inputNumber('6')" class="btn btn-number">6</button>
      <button @click="operate('-')" class="btn btn-operator">-</button>
      
      <button @click="inputNumber('1')" class="btn btn-number">1</button>
      <button @click="inputNumber('2')" class="btn btn-number">2</button>
      <button @click="inputNumber('3')" class="btn btn-number">3</button>
      <button @click="operate('+')" class="btn btn-operator">+</button>
      
      <button @click="inputNumber('0')" class="btn btn-number btn-zero">0</button>
      <button @click="inputDecimal" class="btn btn-number">.</button>
      <button @click="calculate" class="btn btn-equals">=</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const currentNumber = ref('0')
const previousNumber = ref('')
const operator = ref('')
const waitingForOperand = ref(false)

const display = computed(() => currentNumber.value)
const calculation = computed(() => {
  if (previousNumber.value && operator.value) {
    return `${previousNumber.value} ${operator.value}`
  }
  return ''
})

function inputNumber(num: string) {
  if (waitingForOperand.value) {
    currentNumber.value = num
    waitingForOperand.value = false
  } else {
    currentNumber.value = currentNumber.value === '0' ? num : currentNumber.value + num
  }
}

function inputDecimal() {
  if (waitingForOperand.value) {
    currentNumber.value = '0.'
    waitingForOperand.value = false
  } else if (currentNumber.value.indexOf('.') === -1) {
    currentNumber.value += '.'
  }
}

function clear() {
  currentNumber.value = '0'
  previousNumber.value = ''
  operator.value = ''
  waitingForOperand.value = false
}

function clearEntry() {
  currentNumber.value = '0'
}

function backspace() {
  if (currentNumber.value.length > 1) {
    currentNumber.value = currentNumber.value.slice(0, -1)
  } else {
    currentNumber.value = '0'
  }
}

function operate(nextOperator: string) {
  const inputValue = parseFloat(currentNumber.value)

  if (previousNumber.value === '') {
    previousNumber.value = currentNumber.value
  } else if (operator.value) {
    const currentValue = parseFloat(currentNumber.value)
    const previousValue = parseFloat(previousNumber.value)
    
    const result = performCalculation(previousValue, currentValue, operator.value)
    
    if (result !== null) {
      currentNumber.value = String(result)
      previousNumber.value = String(result)
    }
  }

  waitingForOperand.value = true
  operator.value = nextOperator
}

function calculate() {
  const inputValue = parseFloat(currentNumber.value)
  const previousValue = parseFloat(previousNumber.value)

  if (previousNumber.value && operator.value) {
    const result = performCalculation(previousValue, inputValue, operator.value)
    
    if (result !== null) {
      currentNumber.value = String(result)
      previousNumber.value = ''
      operator.value = ''
      waitingForOperand.value = true
    }
  }
}

function performCalculation(firstOperand: number, secondOperand: number, operator: string): number | null {
  switch (operator) {
    case '+':
      return firstOperand + secondOperand
    case '-':
      return firstOperand - secondOperand
    case '*':
      return firstOperand * secondOperand
    case '/':
      return secondOperand !== 0 ? firstOperand / secondOperand : null
    default:
      return secondOperand
  }
}
</script>

<style scoped>
.calculator {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  background: #2a2a2a;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.calculator-display {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  text-align: right;
  color: white;
}

.calculation {
  font-size: 14px;
  color: #888;
  min-height: 20px;
  margin-bottom: 4px;
}

.result {
  font-size: 32px;
  font-weight: 300;
  min-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calculator-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.btn {
  border: none;
  border-radius: 8px;
  height: 60px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.btn:hover {
  transform: scale(1.05);
}

.btn:active {
  transform: scale(0.95);
}

.btn-number {
  background: #404040;
  color: white;
}

.btn-number:hover {
  background: #505050;
}

.btn-operator {
  background: #ff9500;
  color: white;
}

.btn-operator:hover {
  background: #ffb143;
}

.btn-clear {
  background: #a6a6a6;
  color: black;
}

.btn-clear:hover {
  background: #bfbfbf;
}

.btn-equals {
  background: #ff9500;
  color: white;
  grid-column: span 1;
}

.btn-equals:hover {
  background: #ffb143;
}

.btn-zero {
  grid-column: span 2;
}
</style>