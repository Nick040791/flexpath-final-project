package org.example.models;
import java.math.BigDecimal;
import java.time.LocalDateTime;

//Part Model for DB
public class Part
{
    private int id;
    private String name;
    private String category;
    private String brand;
    private String model;
    private BigDecimal price;
    private String description;
    private boolean is_public;
    private String username;
    private LocalDateTime created_at;

    //Blank constructor
    public Part(){}

    //---------Getters and Setters-----------

    //ID
    public int getId()
    {
        return id;
    }
    public void setId(int id)
    {
        this.id = id;
    }

    //Name
    public String getName()
    {
        return name;
    }
    public void setName(String name)
    {
        this.name = name;
    }

    //Category
    public String getCategory()
    {
        return category;
    }
    public void setCategory(String category)
    {
        this.category = category;
    }

    //Brand
    public String getBrand()
    {
        return brand;
    }
    public void setBrand(String brand)
    {
        this.brand = brand;
    }

    //Model
    public String getModel()
    {
        return model;
    }
    public void  setModel(String model)
    {
        this.model = model;
    }

    //Price
    public BigDecimal getPrice()
    {
        return price;
    }
    public void setPrice(BigDecimal price){
        this.price = price;
    }

    //Description
    public String getDescription()
    {
        return description;
    }
    public  void setDescription(String description)
    {
        this.description = description;
    }

    //Is Public?
    public boolean getIs_Public()
    {
        return is_public;
    }
    public void setIs_Public(boolean is_public) {
        this.is_public = is_public;
    }

    //Username
    public String getUsername()
    {
        return username;
    }
    public void setUsername(String username)
    {
        this.username = username;
    }

    //Created at
    public LocalDateTime getCreated_at()
    {
        return created_at;
    }
    public void setCreated_at(LocalDateTime created_at)
    {
        this.created_at = created_at;
    }

}



