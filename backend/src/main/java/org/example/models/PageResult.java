package org.example.models;
import java.util.List;

//small generic response
public class PageResult<T> {
    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;

    // ---Getters---
    // Get result
    public List<T> getContent() {
        return content;
    }

    // Get page
    public int getPage() {
        return page;
    }

    // Get size
    public int getSize() {
        return size;
    }

    // Get totalElements
    public long getTotalElements() {
        return totalElements;
    }

    // Get totalPages
    public int getTotalPages() {
        return totalPages;
    }

    // Constructor
    public PageResult(List<T> content, int page, int size, long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }
}