package org.example.exceptions;

/**
 * General purpose exception class for DAO operations.
 */
public class DaoException extends RuntimeException{
    /**
     * Constructs a new DaoException with the specified detail message.
     *
     * @param message the detail message.
     */
    public DaoException(String message) {
        super(message);
    }
}
