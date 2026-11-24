/**
 * Пароли демо-аккаунтов. У dev-пользователей и сида — «password1»,
 * у тех, кого создали через формы, — пароль, который задал создатель.
 * (На бэкенде будут только хэши.)
 */
const passwords: Record<string, string> = {};
export const setPassword = (userId: string, password: string) => {
  passwords[userId] = password;
};
export const checkPassword = (userId: string, password: string) =>
  password === (passwords[userId] ?? 'password1');
