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

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Configuration.getInstance().setUserAgentValue(getPackageName());
        setContentView(R.layout.activity_main);

        // Карта
        MapView mapView = findViewById(R.id.mapView);
        mapView.setMultiTouchControls(true);

        // Профіль
        ImageButton profileBtn = findViewById(R.id.profileMenuBtn);
        profileBtn.setOnClickListener(v -> startActivity(new Intent(this, ProfileMenuActivity.class)));

        // Дані для списку
        List<Event> eventList = new ArrayList<>();
        eventList.add(new Event("Summer Fest", "Львів, Стрийський парк", "20 липня", R.drawable.summer_fest));
        eventList.add(new Event("Техно-Конференція", "Київ, КВЦ Парковий", "15 серпня", R.drawable.tech_conf));

        // Налаштування списку
        RecyclerView recyclerView = findViewById(R.id.rvEvents);
        recyclerView.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        recyclerView.setAdapter(new EventAdapter(eventList));
    }
}