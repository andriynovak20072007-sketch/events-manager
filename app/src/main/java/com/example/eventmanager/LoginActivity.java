package com.example.eventmanager;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

public class LoginActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // 1. Знаходимо всі елементи по ID з твого нового XML
        EditText etEmail = findViewById(R.id.etEmail);
        EditText etPassword = findViewById(R.id.etPassword);
        Button btnLogin = findViewById(R.id.btnLogin);
        TextView tvForgot = findViewById(R.id.tvForgotPassword);


        // 2. Логіка кнопки "Увійти"
        btnLogin.setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();
            String password = etPassword.getText().toString().trim();

            if (email.isEmpty() || password.isEmpty()) {
                // Показуємо помилку, якщо поля порожні
                Toast.makeText(this, "Будь ласка, заповніть усі поля", Toast.LENGTH_SHORT).show();
            } else {
                // Тут у майбутньому буде перевірка пароля
                Toast.makeText(this, "Вхід успішний для: " + email, Toast.LENGTH_SHORT).show();
                finish(); // Закриваємо вікно і повертаємось на головну
            }
        });

        // 3. ТАСК: ВІДНОВЛЕННЯ ПАРОЛЯ
        tvForgot.setOnClickListener(v -> {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("Відновлення пароля");

            // Робимо поле вводу для пошти в самому діалозі
            final EditText input = new EditText(this);
            input.setHint("Ваш Email");
            input.setPadding(50, 40, 50, 40); // Трохи відступів, щоб виглядало гарніше
            builder.setView(input);

            builder.setPositiveButton("Надіслати", (dialog, which) -> {
                String resetEmail = input.getText().toString();
                if (!resetEmail.isEmpty()) {
                    Toast.makeText(this, "Інструкцію надіслано на " + resetEmail, Toast.LENGTH_LONG).show();
                }
            });

            builder.setNegativeButton("Скасувати", (dialog, which) -> dialog.cancel());
            builder.show();
        });

        /* // 4. Логіка Google
        btnGoogle.setOnClickListener(v -> {
            Toast.makeText(this, "Вхід через Google тимчасово недоступний", Toast.LENGTH_SHORT).show();
        });
        */
    }
}