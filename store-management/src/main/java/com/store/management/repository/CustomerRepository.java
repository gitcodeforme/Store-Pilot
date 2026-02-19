package com.store.management.repository;

import com.store.management.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigInteger;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, BigInteger> {
    Optional<Customer> findByCustomerCode(String customerCode);
    Optional<Customer> findByMobileNumber(String mobileNumber);
    Optional<Customer> findFirstByCustomerNameIgnoreCase(String customerName);

    @Query(value = "SELECT customer_code FROM customer ORDER BY CAST(SUBSTRING(customer_code, 4) AS UNSIGNED) DESC LIMIT 1", nativeQuery = true)
    String findLastCustomerCode();

    // ✅ Null-safe existence check
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
           "FROM Customer c " +
           "WHERE (:customerName IS NOT NULL AND LOWER(c.customerName) = LOWER(:customerName)) " +
           "AND (:mobileNumber IS NOT NULL AND c.mobileNumber = :mobileNumber)")
    boolean existsCustomer(@Param("customerName") String customerName,
                           @Param("mobileNumber") String mobileNumber);
}
