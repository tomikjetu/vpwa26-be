declare module '@adonisjs/core/http' {
  interface HttpContext {
    channel?: import('#models/channel').default,
    member?: import('#models/member').default,
    user_member?: import('#models/member').default | null,
  }
}