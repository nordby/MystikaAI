// bot/src/middleware/user.js
class UserMiddleware {
  async loadUser(context) {
    if (context.from) {
      context.user = {
        id: context.from.id,
        username: context.from.username,
        firstName: context.from.first_name,
        lastName: context.from.last_name,
        languageCode: context.from.language_code
      };
    }
  }
}

module.exports = new UserMiddleware();