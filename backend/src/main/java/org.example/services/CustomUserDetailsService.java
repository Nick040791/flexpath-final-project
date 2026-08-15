package org.example.services;

import eu.fraho.spring.securityJwt.base.dto.JwtUser;
import org.example.daos.UserDao;
import org.example.models.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom user details service for JWT authentication.
 */
@Component
public class CustomUserDetailsService implements UserDetailsService {
    /**
     * The user data access object.
     */
    private final UserDao userDao;

    /**
     * Creates a new custom user details service.
     *
     * @param userDao The user data access object.
     */
    public CustomUserDetailsService(UserDao userDao) {
        this.userDao = userDao;
    }

    /**
     * Loads a user by their username.
     *
     * @param username The username of the user.
     * @return The user with the given username.
     * @throws UsernameNotFoundException If the user is not found.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Get user
        User user = userDao.getUserByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found.");
        }

        // Get roles -> authorities
        List<String> roles = userDao.getRoles(username);
        List<GrantedAuthority> authorities = new ArrayList<>();
        for (String role : roles) {
            authorities.add(new SimpleGrantedAuthority(role));
        }

        // Create JwtUser
        JwtUser jwtUser = new JwtUser();
        jwtUser.setUsername(user.getUsername());
        jwtUser.setPassword(user.getPassword());
        jwtUser.setAuthorities(authorities);

        // Not sure if this is necessary
        jwtUser.setAccountNonExpired(true);
        jwtUser.setAccountNonLocked(true);
        jwtUser.setApiAccessAllowed(true);
        jwtUser.setCredentialsNonExpired(true);
        jwtUser.setEnabled(true);
        return jwtUser;
    }
}
