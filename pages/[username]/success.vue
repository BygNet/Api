<template>
  <main class="container">
    <section class="card">
      <h2>Thanks — your question was sent</h2>

      <div class="buttons">
        <a class="big" href="https://byg.gg">Go back to Byg</a>
        <button class="normal" @click="submitAnother">Submit another</button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from '#imports'
const route = useRoute()
const router = useRouter()
const username = String(route.params.username || '')

function submitAnother() {
  router.push({ path: `/${username}` })
}
</script>

<style scoped lang="sass">
.container
  min-height: 100vh
  display: flex
  align-items: center
  justify-content: center
  padding: 24px

.card
  width: 100%
  max-width: 640px
  background: #fff
  border-radius: 12px
  padding: 24px
  box-shadow: 0 6px 30px rgba(0,0,0,0.08)
  text-align: center

.buttons
  display: flex
  gap: 12px
  justify-content: center
  margin-top: 20px

a.big
  background: #dd289e
  color: white
  padding: 10px 16px
  border-radius: 8px
  text-decoration: none
  font-weight: 700

button.normal
  padding: 10px 16px
  border-radius: 8px
  border: 1px solid #eee
  background: transparent
</style>
