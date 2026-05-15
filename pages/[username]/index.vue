<template>
  <main class="container">
    <section class="card">
      <div class="profile">
        <img
          v-if="profile?.user?.avatarUrl"
          :src="profile.user.avatarUrl"
          alt="avatar"
          class="avatar"
        />
        <div class="meta">
          <h1>{{ displayName }}</h1>
          <p class="username">@{{ username }}</p>
        </div>
      </div>

      <label for="ask">Ask anonymously</label>
      <textarea
        id="ask"
        v-model="content"
        placeholder="Write your question..."
        rows="6"
      ></textarea>
      <div class="actions">
        <button
          class="primary"
          :disabled="isSubmitting || !canSubmit"
          @click="submitAsk"
        >
          <span v-if="isSubmitting">Sending...</span>
          <span v-else>Send Ask</span>
        </button>
        <button class="link" @click="clear">Clear</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <p class="small">
        Your question will be sent anonymously to the user. Keep it respectful.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter, useRuntimeConfig } from '#imports'
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const username = String(route.params.username || '')

const profile = ref<any | null>(null)
const content = ref('')
const isSubmitting = ref(false)
const error = ref('')

const displayName = computed(() => {
  if (!profile.value) return username
  return (
    profile.value.user.displayName || profile.value.user.username || username
  )
})

const canSubmit = computed(() => content.value.trim().length > 0)

async function fetchProfile() {
  if (!username) return
  try {
    const res = await $fetch(
      `${config.public.apiBase}/profile/${encodeURIComponent(username)}`
    )
    profile.value = res
  } catch (err) {
    // ignore, profile is optional
    profile.value = null
  }
}

function clear() {
  content.value = ''
  error.value = ''
}

async function submitAsk() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  error.value = ''

  try {
    await $fetch(
      `${config.public.apiBase}/asks/${encodeURIComponent(username)}`,
      {
        method: 'POST',
        body: { content: content.value },
      }
    )

    // go to success page
    await router.push({ path: `/${username}/success` })
  } catch (err: any) {
    if (err?.data) {
      error.value = String(err.data) || 'Failed to send'
    } else if (err?.message) {
      error.value = err.message
    } else {
      error.value = 'Failed to send ask.'
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
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

.profile
  display: flex
  align-items: center
  gap: 12px
  margin-bottom: 12px

.avatar
  width: 56px
  height: 56px
  border-radius: 8px
  object-fit: cover

.meta h1
  margin: 0
  font-size: 20px

.username
  margin: 0
  color: #666
  font-size: 14px

textarea
  width: 100%
  border: 1px solid #e6e6e6
  border-radius: 8px
  padding: 12px
  font-size: 15px
  resize: vertical

.actions
  display: flex
  gap: 8px
  margin-top: 12px

button
  padding: 10px 14px
  border-radius: 8px
  border: none
  cursor: pointer

.primary
  background: #dd289e
  color: white
  font-weight: 600

.primary:disabled
  opacity: 0.6
  cursor: default

.link
  background: transparent
  color: #333
  border: 1px solid #eee

.error
  color: #b00020
  margin-top: 12px

.small
  margin-top: 18px
  color: #666
  font-size: 13px

@media (max-width: 520px)
  .card
    padding: 16px
</style>
