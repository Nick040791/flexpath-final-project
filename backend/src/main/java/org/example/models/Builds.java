package org.example.models;
import java.time.LocalDateTime;

public class Builds {
    private int id;
    private String name;
    private String description;
    private boolean is_public;
    private String username;
    private LocalDateTime created_at;

    //Blank Constructor
    public Builds(){}

    //-----Getters and Setters----

    //ID
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }

    //Name
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    //Description
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    //Is Public?
    public boolean getIs_Public() {
        return is_public;
    }
    public void setIs_Public(boolean is_public) {
        this.is_public = is_public;
    }

    //Username
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    //Created at
    public LocalDateTime getCreated_at() {
        return created_at;
    }
    public void setCreated_at(LocalDateTime created_at) {
        this.created_at = created_at;
    }
}


