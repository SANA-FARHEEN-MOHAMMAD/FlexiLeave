package com.sana.leave_management.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "leave_requests")
public class LeaveRequest {
    @Id
    private String id;

    // employee's randomId (4-digit) — matches User.randomId
    private int employeeId;
    private String employeeName;
    private String employeeEmail;

    // manager's randomId
    private int managerId;

    private String subject; // short reason/title
    private String body;    // details / description

    // optional start & end date strings (ISO) for simplicity
    private String startDate;
    private String endDate;

    private String status; // PENDING / ACCEPTED / REJECTED
    private Date dateCreated;

    // whether the employee has clicked "OK" after seeing accepted/rejected
    private boolean acknowledged = false;

    public LeaveRequest() {}

    public LeaveRequest(int employeeId, int managerId, String subject, String body, String status, Date dateCreated) {
        this.employeeId = employeeId;
        this.managerId = managerId;
        this.subject = subject;
        this.body = body;
        this.status = status;
        this.dateCreated = dateCreated;
    }

    // getters & setters

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getEmployeeId() { return employeeId; }
    public void setEmployeeId(int employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeEmail() { return employeeEmail; }
    public void setEmployeeEmail(String employeeEmail) { this.employeeEmail = employeeEmail; }

    public int getManagerId() { return managerId; }
    public void setManagerId(int managerId) { this.managerId = managerId; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getDateCreated() { return dateCreated; }
    public void setDateCreated(Date dateCreated) { this.dateCreated = dateCreated; }

    public boolean isAcknowledged() { return acknowledged; }
    public void setAcknowledged(boolean acknowledged) { this.acknowledged = acknowledged; }
}
