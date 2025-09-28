package com.sana.leave_management.repository;

import com.sana.leave_management.model.LeaveRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LeaveRequestRepository extends MongoRepository<LeaveRequest, String> {

    List<LeaveRequest> findByManagerIdAndStatus(int managerId, String status);
    List<LeaveRequest> findByEmployeeId(int employeeId);
    List<LeaveRequest> findByManagerIdAndStatusIn(int managerId, List<String> statuses);

    // employee-side queries
    List<LeaveRequest> findByEmployeeIdAndAcknowledgedFalse(int employeeId);
    List<LeaveRequest> findByEmployeeIdAndAcknowledgedTrue(int employeeId);
    List<LeaveRequest> findByEmployeeIdAndAcknowledgedTrueAndStatus(int employeeId, String status);
    
}
