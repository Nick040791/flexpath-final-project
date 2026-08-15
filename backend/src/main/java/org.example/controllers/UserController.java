package org.example.controllers;

import org.example.models.User;
import org.example.daos.UserDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Controller for users.
 * This class is responsible for handling all HTTP requests related to users.
 */
@RestController
@CrossOrigin
@RequestMapping("/api/users")
@PreAuthorize("hasAuthority('ADMIN')")
public class UserController {
    /**
     * The user data access object.
     */
    @Autowired
    private UserDao userDao;

    /**
     * Gets all users.
     *
     * @return A list of all users.
     */
    @GetMapping
    public List<User> getAll() {
        return userDao.getUsers();
    }

    /**
     * Gets a user by their username.
     *
     * @param username The username of the user.
     * @return The user with the given username.
     */
    @GetMapping(path = "/{username}")
    public User get(@PathVariable String username) {
        return userDao.getUserByUsername(username);
    }

    /**
     * Creates a new user.
     *
     * @param user The user to create.
     * @return The created user.
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    @PreAuthorize("permitAll()")
    public User create(@RequestBody User user) {
        return userDao.createUser(user);
    }

    /**
     * Updates a specific user's password.
     *
     * @param password The new password.
     * @param username The username of the user.
     * @return The updated user.
     */
    @PutMapping(path = "/{username}/password")
    public User updatePassword(@RequestBody String password, @PathVariable String username) {
        User user = userDao.getUserByUsername(username);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        user.setPassword(password);
        return userDao.updatePassword(user);
    }

    /**
     * Deletes a user.
     *
     * @param username The username of the user to delete.
     */
    @DeleteMapping(path = "/{username}")
    public int delete(@PathVariable String username) {
        return userDao.deleteUser(username);
    }

    /**
     * Gets all roles for a user.
     *
     * @return A list of all roles for the user.
     */
    @GetMapping(path = "/{username}/roles")
    public List<String> getRoles(@PathVariable String username) {
        return userDao.getRoles(username);
    }

    /**
     * Adds a role to a user.
     *
     * @param username The username of the user.
     * @param role The role to add.
     * @return A list of all roles for the user.
     */
    @PostMapping(path = "/{username}/roles")
    public List<String> addRole(@PathVariable String username, @RequestBody String role) {
        return userDao.addRole(username, role.toUpperCase());
    }

    /**
     * Deletes a role from a user.
     *
     * @param username The username of the user.
     * @param role The role to delete.
     */
    @DeleteMapping(path = "/{username}/roles/{role}")
    public int deleteRole(@PathVariable String username, @PathVariable String role) {
        var affectedRows = userDao.deleteRole(username, role.toUpperCase());
        if (affectedRows == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found");
        } else {
            return affectedRows;
        }
    }
}
