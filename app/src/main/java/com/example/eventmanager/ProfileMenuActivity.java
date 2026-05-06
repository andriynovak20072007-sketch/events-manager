package com.example.eventmanager;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class ProfileMenuActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Встановлюємо макет

        setContentView(R.layout.activity_profile_menu);

        // 1. Кнопка закриття (Хрестик)
        ImageButton btnClose = findViewById(R.id.btnClose);
        if (btnClose != null) {
            btnClose.setOnClickListener(v -> finish());
        }

        // 2. Кнопка "Увійти" (Нижня сіра кнопка)
        Button btnLogin = findViewById(R.id.btnMenuLogin);
        if (btnLogin != null) {
            btnLogin.setOnClickListener(v -> {
                Intent intent = new Intent(ProfileMenuActivity.this, LoginActivity.class);
                startActivity(intent);
            });
        }

        // 3. Кнопка "Зареєструватися" (Нижня синя кнопка)
        Button btnRegister = findViewById(R.id.btnMenuRegister);
        if (btnRegister != null) {
            btnRegister.setOnClickListener(v -> {
                Intent intent = new Intent(ProfileMenuActivity.this, RegisterActivity.class);
                startActivity(intent);
            });
        }

        // 4. Пункти списку (Обране, Мої події)
        TextView tvFavorites = findViewById(R.id.tvFavorites);
        if (tvFavorites != null) {
            tvFavorites.setOnClickListener(v -> {
                Toast.makeText(this, "Розділ 'Обране' у розробці", Toast.LENGTH_SHORT).show();
            });
        }

        TextView tvMyEvents = findViewById(R.id.tvMyEvents);
        if (tvMyEvents != null) {
            tvMyEvents.setOnClickListener(v -> {
                Toast.makeText(this, "Ваші події з'являться тут пізніше", Toast.LENGTH_SHORT).show();
            });
        }

        TextView tvCreateEvent = findViewById(R.id.tvCreateEvent);
        if (tvCreateEvent != null) {
            tvCreateEvent.setOnClickListener(v -> {
                Toast.makeText(this, "Функція створення події скоро з'явиться", Toast.LENGTH_SHORT).show();
            });
        }
    }
}