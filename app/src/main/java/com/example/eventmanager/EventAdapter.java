package com.example.eventmanager;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class EventAdapter extends RecyclerView.Adapter<EventAdapter.EventViewHolder> {

    private List<Event> eventList;

    public EventAdapter(List<Event> eventList) {
        this.eventList = eventList;
    }

    @NonNull
    @Override
    public EventViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_event, parent, false);
        return new EventViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull EventViewHolder holder, int position) {
        Event event = eventList.get(position);

        // Ось тут ми використовуємо ті самі назви, що оголошені в EventViewHolder нижче
        holder.tvTitle.setText(event.getTitle());
        holder.tvLocation.setText(event.getLocation());
        holder.tvDate.setText(event.getDate());
        holder.ivImage.setImageResource(event.getImageResId());
    }

    @Override
    public int getItemCount() {
        return eventList.size();
    }

    // Внутрішній клас, де ми оголошуємо змінні
    public static class EventViewHolder extends RecyclerView.ViewHolder {
        ImageView ivImage;
        TextView tvTitle, tvLocation, tvDate;
        Button btnLearnMore;

        public EventViewHolder(@NonNull View itemView) {
            super(itemView);
            // Прив'язуємо змінні до ID з XML
            ivImage = itemView.findViewById(R.id.ivEventImage);
            tvTitle = itemView.findViewById(R.id.tvEventTitle);
            tvLocation = itemView.findViewById(R.id.tvEventLocation);
            tvDate = itemView.findViewById(R.id.tvEventDate);
            btnLearnMore = itemView.findViewById(R.id.btnLearnMore);
        }
    }
}