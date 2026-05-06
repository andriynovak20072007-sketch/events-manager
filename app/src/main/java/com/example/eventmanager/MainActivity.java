package com.example.eventmanager;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageButton;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.List;
import org.osmdroid.config.Configuration;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay; // якщо знадобиться пізніше

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        // Імпорти (додай їх у верхню частину файлу, якщо треба):

// 1. Ініціалізація конфігурації (це обов'язково для osmdroid)
        Configuration.getInstance().setUserAgentValue(getPackageName());

// 2. Знаходимо карту
        MapView mapView = findViewById(R.id.mapView);
        mapView.setMultiTouchControls(true); // Дозволяє зумити пальцями

// 3. Встановлюємо початковий вигляд (наприклад, центр України)
        mapView.getController().setZoom(6.0);
        mapView.getController().setCenter(new org.osmdroid.util.GeoPoint(49.0, 31.0));

        // 1. Налаштування іконки профілю
        ImageButton profileBtn = findViewById(R.id.profileMenuBtn);
        if (profileBtn != null) {
            profileBtn.setOnClickListener(v -> {
                Intent intent = new Intent(MainActivity.this, ProfileMenuActivity.class);
                startActivity(intent);
            });
        }

        // 2. Ініціалізація даних
        List<Event> eventList = new ArrayList<>();
        eventList.add(new Event("Summer Fest", "Львів, Стрийський парк", "20 липня, 18:00", R.drawable.summer_fest));
        eventList.add(new Event("Техно-Конференція", "Київ, КВЦ Парковий", "15 серпня, 10:00", R.drawable.tech_conf));
        eventList.add(new Event("Майстер-клас з живопису", "Львів, Арт-центр", "25 липня, 15:00", R.drawable.art_class));

        // 3. Підключення RecyclerView
        RecyclerView recyclerView = findViewById(R.id.rvEvents);

        // Встановлюємо менеджер списку
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        // ВАЖЛИВО: Вимикаємо внутрішній скролінг для роботи в NestedScrollView
        recyclerView.setNestedScrollingEnabled(false);

        // Створюємо та встановлюємо адаптер
        EventAdapter adapter = new EventAdapter(eventList);
        recyclerView.setAdapter(adapter);
    }
}