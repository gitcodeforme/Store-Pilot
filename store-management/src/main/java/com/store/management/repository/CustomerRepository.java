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

   @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
       "FROM Customer c " +
       "WHERE LOWER(c.customerName) = LOWER(:customerName) " +
       "AND c.mobileNumber = :mobileNumber")
boolean existsCustomer(@Param("customerName") String customerName,
                       @Param("mobileNumber") String mobileNumber);
}