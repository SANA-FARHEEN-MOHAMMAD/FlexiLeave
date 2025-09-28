package com.sana.leave_management.service;

import com.sana.leave_management.model.LeaveRequest;
import com.sana.leave_management.model.User;
import com.sana.leave_management.repository.LeaveRequestRepository;
import com.sana.leave_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LeaveRequestService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private UserRepository userRepository;

    // optional - if mail not configured, we will log instead
    @Autowired(required = false)

    // Create leave request: attach employee name/email using userRepository
    public LeaveRequest createLeaveRequest(int employeeId, int managerId, String subject, String body, String startDate, String endDate) {
        LeaveRequest lr = new LeaveRequest();
        lr.setEmployeeId(employeeId);
        lr.setManagerId(managerId);
        lr.setSubject(subject);
        lr.setBody(body);
        lr.setStartDate(startDate);
        lr.setEndDate(endDate);
        lr.setStatus("PENDING");
        lr.setDateCreated(new Date());
        // attach employee details if user exists
        Optional<User> uOpt = userRepository.findByRandomId(employeeId);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            lr.setEmployeeName(u.getName());
            lr.setEmployeeEmail(u.getEmail());
        }
        return leaveRequestRepository.save(lr);
    }

    // Manager: get pending leaves assigned to them
    public List<LeaveRequest> getPendingLeavesForManager(int managerId) {
        return leaveRequestRepository.findByManagerIdAndStatus(managerId, "PENDING");
    }

    // Manager: update leave status and notify employee by email
    public LeaveRequest updateLeaveStatus(String leaveId, String status) throws Exception {
        Optional<LeaveRequest> lrOpt = leaveRequestRepository.findById(leaveId);
        if (lrOpt.isPresent()) {
            LeaveRequest lr = lrOpt.get();
            lr.setStatus(status.toUpperCase());
            LeaveRequest saved = leaveRequestRepository.save(lr);

            return saved;
        }
        return null;
    }

    // Employee: get items that are not yet acknowledged (show pending + decisions)
    public List<LeaveRequest> getPendingForEmployee(int employeeId) {
        return leaveRequestRepository.findByEmployeeIdAndAcknowledgedFalse(employeeId);
    }

    // Employee acknowledge (OK button) — mark acknowledged true (moves to history)
    public void acknowledgeLeave(String leaveId) {
        Optional<LeaveRequest> lrOpt = leaveRequestRepository.findById(leaveId);
        if (lrOpt.isPresent()) {
            LeaveRequest lr = lrOpt.get();
            lr.setAcknowledged(true);
            leaveRequestRepository.save(lr);
        }
    }

    // Employee: get history (acknowledged true) with optional filtering by status or year
    public List<LeaveRequest> getHistoryForEmployee(int employeeId, String status, Integer year) {
        List<LeaveRequest> all = leaveRequestRepository.findByEmployeeIdAndAcknowledgedTrue(employeeId);
        return all.stream().filter(lr -> {
            boolean ok = true;
            if (status != null && !status.isBlank()) ok = ok && lr.getStatus().equalsIgnoreCase(status);
            if (year != null) {
                Date d = lr.getDateCreated();
                @SuppressWarnings("deprecation")
                int y = d.getYear() + 1900;
                ok = ok && (y == year);
            }
            return ok;
        }).collect(Collectors.toList());
    }

public List<LeaveRequest> getHistoryForManager(int managerId) {
    return leaveRequestRepository.findByManagerIdAndStatusIn(managerId, List.of("ACCEPTED", "REJECTED"));
}


}
