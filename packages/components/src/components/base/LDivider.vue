<template>
  <div
    :class="[
      'l-divider',
      `l-divider--${direction}`,
      dashed ? 'l-divider--dashed' : '',
      contentPosition ? `l-divider--with-text l-divider--with-text-${contentPosition}` : ''
    ]"
  >
    <div v-if="$slots.default" class="l-divider__text">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** 分割线方向 */
  direction?: 'horizontal' | 'vertical'
  /** 是否虚线 */
  dashed?: boolean
  /** 文本位置 */
  contentPosition?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  dashed: false,
  contentPosition: undefined
})
</script>

<script lang="ts">
export default {
  name: 'LDivider'
}
</script>

<style scoped>
.l-divider {
  position: relative;
  background-color: var(--l-border-color, #e4e7ed);
}

.l-divider--horizontal {
  display: block;
  height: 1px;
  width: 100%;
  margin: 24px 0;
}

.l-divider--vertical {
  display: inline-block;
  width: 1px;
  height: 1em;
  margin: 0 8px;
  vertical-align: middle;
}

.l-divider--dashed {
  background-image: linear-gradient(
    to right,
    var(--l-border-color, #e4e7ed) 0%,
    var(--l-border-color, #e4e7ed) 50%,
    transparent 50%
  );
  background-size: 16px 1px;
  background-repeat: repeat-x;
}

.l-divider--with-text {
  display: flex;
  align-items: center;
  margin: 16px 0;
}

.l-divider--with-text::before,
.l-divider--with-text::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--l-border-color, #e4e7ed);
}

.l-divider--with-text-left::before {
  width: 5%;
}

.l-divider--with-text-right::after {
  width: 5%;
}

.l-divider__text {
  padding: 0 20px;
  font-size: 14px;
  color: var(--l-text-color-secondary, #909399);
  white-space: nowrap;
}
</style>