// Ручний мок для google-auth-library (бібліотека не встановлена як залежність)
// Jest підхватить цей файл автоматично через папку __mocks__

const OAuth2Client = jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn()
}));

module.exports = { OAuth2Client };
