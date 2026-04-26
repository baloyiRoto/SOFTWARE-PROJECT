package com.spendwise.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    private static final String URL = "jdbc:derby://localhost:1527/SpendSmart;create=true";
    private static final String USER = "app"; // Default GlassFish DB user
    private static final String PASS = "123"; // Default GlassFish DB password

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("org.apache.derby.jdbc.ClientDriver");
            return DriverManager.getConnection(URL, USER, PASS);
        } catch (ClassNotFoundException e) {
            throw new SQLException("Java DB Driver not found: " + e.getMessage());
        }
    }
}