-- Add the persisted admission checkpoint used while remote enrolment runs.
ALTER TYPE "AdmissionStatus" ADD VALUE 'ENROLLING' AFTER 'ACCEPTED';
