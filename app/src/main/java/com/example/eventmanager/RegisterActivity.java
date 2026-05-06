package com.example.eventmanager;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class RegisterActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        // 1. Знаходимо всі елементи по ID з твого нового CardView дизайну
        EditText etEmail = findViewById(R.id.etRegisterEmail);
        EditText etPassword = findViewById(R.id.etRegisterPassword);
        EditText etUsername = findViewById(R.id.etRegisterUsername);
        Button btnRegister = findViewById(R.id.btnRegisterSubmit);

        // 2. Логіка кнопки "Створити акаунт"
        btnRegister.setOnClickListener(v -> {
            // Зчитуємо текст із полів
            String email = etEmail.getText().toString().trim();
            String password = etPassword.getText().toString().trim();
            String username = etUsername.getText().toString().trim();

            // 3. Валідація (перевірка) введених даних
            if (email.isEmpty() || password.isEmpty() || username.isEmpty()) {
                Toast.makeText(this, "Будь ласка, заповніть усі поля", Toast.LENGTH_SHORT).show();
            } else if (password.length() < 6) {
                // Додаємо просту перевірку безпеки
                Toast.makeText(this, "Пароль має бути не менше 6 символів", Toast.LENGTH_SHORT).show();
            } else {
                // Тут у майбутньому буде код для запису в базу даних
                String message = "Вітаємо, " + username + "! Реєстрація успішна.";
                Toast.makeText(this, message, Toast.LENGTH_LONG).show();

                // Закриваємо екран реєстрації та повертаємо користувача назад
                finish();
            }
        });


        /*
        findViewById(R.id.btnGoogleRegister).setOnClickListener(v -> {
            Toast.makeText(this, "Реєстрація через Google скоро з'явиться", Toast.LENGTH_SHORT).show();
        });
        */
    }
}