import { defineComponent, h } from 'vue'
import MusicPlayer from './App.vue'

export default defineComponent({
  name: 'MusicPlayer',
  components: {
    MusicPlayer,
  },
  setup() {
    return () => h(MusicPlayer)
  },
})
