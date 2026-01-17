import React, { ElementType, JSX } from 'react'
import CIcon from '@coreui/icons-react'
import { CNavItem, CNavGroup, CNavTitle } from '@coreui/react-pro'
import {
  cilHome,
  cilSettings,
  cilLayers,
  cilEducation,
  cilSchool,
  cilChartPie,
  cilSpreadsheet,
  cilLightbulb,
  cilPeople,
  cilUser,
  cilWarning,
  cilBriefcase,
  cilBuilding,
  cilBalanceScale,
  cilChatBubble,
  cilChartLine,
  cilImage,
  cilInfo,
  cilCreditCard,
  cilDollar,
  cilLockLocked,
} from '@coreui/icons'

export type Badge = {
  color: string
  text: string
}

export type NavItem = {
  badge?: Badge
  component: string | ElementType
  href?: string
  icon?: string | JSX.Element
  items?: NavItem[]
  name: string | JSX.Element
  to?: string
}

const icon = (i: any) => <CIcon icon={i} customClassName="nav-icon" />

// ARP navigation migrated from your CoreUI Free template
const _nav: NavItem[] = [
  {
    component: CNavItem,
    name: 'Home',
    to: '/dashboard',
    icon: icon(cilHome),
  },

  {
    component: CNavTitle,
    name: 'Configuration',
  },

  {
    component: CNavGroup,
    name: 'Setup',
    to: '/setup',
    icon: icon(cilSettings),
    items: [
      { component: CNavItem, name: 'Institution', to: '/setup/institution' },
      { component: CNavItem, name: 'Department', to: '/setup/department' },
      { component: CNavItem, name: 'Programmes', to: '/setup/programmes' },
      { component: CNavItem, name: 'Academic Year', to: '/setup/academic-year' },
      { component: CNavItem, name: 'Classes', to: '/setup/classes' },
      { component: CNavItem, name: 'Regulation', to: '/setup/regulation' },
      { component: CNavItem, name: 'Courses', to: '/setup/courses' },
      { component: CNavItem, name: 'Regulation Map', to: '/setup/regulation-map' },
      { component: CNavItem, name: 'Combined Courses', to: '/setup/combined-courses' },
      { component: CNavItem, name: 'Student', to: '/setup/student' },
      { component: CNavItem, name: 'Faculty', to: '/setup/faculty' },
      { component: CNavItem, name: 'Calendar', to: '/setup/calendar' },
      { component: CNavItem, name: 'Timetable', to: '/setup/timetable' },
      { component: CNavItem, name: 'Question Models', to: '/setup/question-models' },
      { component: CNavItem, name: 'CIA Components', to: '/setup/cia-components' },
      { component: CNavItem, name: 'CIA Computations', to: '/setup/cia-computations' },
      { component: CNavItem, name: 'Assessment Setup', to: '/setup/assessment-setup' },
      { component: CNavItem, name: 'Upload Photo', to: '/setup/upload-photo' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Accreditation',
    to: '/accreditation',
    icon: icon(cilLayers),
    items: [
      { component: CNavItem, name: 'Add Manual', to: '/accreditation/add-manual' },
      { component: CNavItem, name: 'Add Data Labels', to: '/accreditation/add-data-labels' },
      { component: CNavItem, name: 'Extended Profile', to: '/accreditation/extended-profile' },
      { component: CNavItem, name: 'Add EP Metrics', to: '/accreditation/add-ep-metrics' },
      { component: CNavItem, name: 'Criteria', to: '/accreditation/criteria' },
      { component: CNavItem, name: 'Key Indicators', to: '/accreditation/key-indicators' },
      { component: CNavItem, name: 'Main Metrics', to: '/accreditation/main-metrics' },
      { component: CNavItem, name: 'Sub Metrics', to: '/accreditation/sub-metrics' },
      { component: CNavItem, name: 'Qualitative', to: '/accreditation/qualitative' },
      { component: CNavItem, name: 'Quantitative', to: '/accreditation/quantitative' },
      { component: CNavItem, name: 'Grade', to: '/accreditation/grade' },
      { component: CNavItem, name: 'Documents', to: '/accreditation/documents' },
      { component: CNavItem, name: 'Expert Panel', to: '/accreditation/expert-panel' },
    ],
  },

  {
    component: CNavTitle,
    name: 'Learning Management',
  },
  {
    component: CNavGroup,
    name: 'LMS',
    to: '/lms',
    icon: icon(cilEducation),
    items: [
      { component: CNavItem, name: 'Course Allotment', to: '/lms/course-allotment' },
      { component: CNavItem, name: 'Student Allotment', to: '/lms/student-allotment' },
      { component: CNavItem, name: 'Upload Timetable', to: '/lms/upload-timetable' },
      { component: CNavItem, name: 'View Timetable', to: '/lms/view-timetable' },
      { component: CNavItem, name: 'View Calendar', to: '/lms/view-calendar' },
      { component: CNavItem, name: 'Course Contents', to: '/lms/course-contents' },
      { component: CNavItem, name: 'Course Materials', to: '/lms/course-materials' },
      { component: CNavItem, name: 'Common Schedule', to: '/lms/common-schedule' },
      { component: CNavItem, name: 'Lecture Schedule', to: '/lms/lecture-schedule' },
      { component: CNavItem, name: 'Attendance', to: '/lms/attendance' },
      { component: CNavItem, name: 'Syllabus Completion', to: '/lms/syllabus-completion' },
      { component: CNavItem, name: 'Online Classes', to: '/lms/online-classes' },
      { component: CNavItem, name: 'Activities', to: '/lms/activities' },
      { component: CNavItem, name: 'Learner Activities', to: '/lms/learner-activities' },
      { component: CNavItem, name: 'Assignments', to: '/lms/assignments' },
      { component: CNavItem, name: 'Internal Assessment', to: '/lms/internal-assessment' },
    ],
  },

  // Remaining ARP phases are kept in the menu (routes are placeholders in Phase-1)
  {
    component: CNavGroup,
    name: 'Academics',
    to: '/academics',
    icon: icon(cilSchool),
    items: [
      { component: CNavItem, name: 'Tutor Ward', to: '/academics/tutor-ward' },
      { component: CNavItem, name: 'Ward Enrollment', to: '/academics/ward-enrollment' },
      { component: CNavItem, name: 'Ward Profile', to: '/academics/ward-profile' },
      { component: CNavItem, name: 'Ward Meetings', to: '/academics/ward-meetings' },
      { component: CNavItem, name: 'Academic Events', to: '/academics/academic-events' },
      { component: CNavItem, name: 'Student Profile', to: '/academics/student-profile' },
      { component: CNavItem, name: 'Faculty Profile', to: '/academics/faculty-profile' },
    ],
  },

  {
    component: CNavGroup,
    name: 'OBE',
    to: '/obe',
    icon: icon(cilChartPie),
    items: [
      { component: CNavItem, name: 'Dashboard', to: '/obe/dashboard' },
      { component: CNavItem, name: 'Configuration', to: '/obe/configuration' },
      { component: CNavItem, name: 'Course Outcomes', to: '/obe/course-outcomes' },
      { component: CNavItem, name: 'Mark Entry', to: '/obe/mark-entry' },
      { component: CNavItem, name: 'OBE Attainment', to: '/obe/obe-attainment' },
      { component: CNavItem, name: 'Attainment Reports', to: '/obe/attainment-reports' },
      { component: CNavItem, name: 'Articulation Matrix', to: '/obe/articulation-matrix' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Evaluation',
    to: '/evaluation',
    icon: icon(cilSpreadsheet),
    items: [
      { component: CNavItem, name: 'Question Bank', to: '/evaluation/question-bank' },
      { component: CNavItem, name: 'Question Paper', to: '/evaluation/question-paper' },
      { component: CNavItem, name: 'Schedule Examination', to: '/evaluation/schedule-examination' },
      { component: CNavItem, name: 'Online Examination', to: '/evaluation/online-examination' },
      { component: CNavItem, name: 'Mark Entry', to: '/evaluation/mark-entry' },
      { component: CNavItem, name: 'Result Analysis', to: '/evaluation/result-analysis' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Research',
    to: '/research',
    icon: icon(cilLightbulb),
    items: [
      { component: CNavItem, name: 'Activities', to: '/research/activities' },
      { component: CNavItem, name: 'Innovation', to: '/research/innovation' },
      { component: CNavItem, name: 'Extension', to: '/research/extension' },
      { component: CNavItem, name: 'Outreach', to: '/research/outreach' },
      { component: CNavItem, name: 'Collaboration', to: '/research/collaboration' },
      { component: CNavItem, name: 'MoUs', to: '/research/mous' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Student Support',
    to: '/student-support',
    icon: icon(cilPeople),
    items: [
      { component: CNavItem, name: 'Skill Enhancement', to: '/student-support/skill-enhancement' },
      { component: CNavItem, name: 'Competitive Exams', to: '/student-support/competitive-exams' },
      { component: CNavItem, name: 'Career Guidance', to: '/student-support/career-guidance' },
      { component: CNavItem, name: 'Counselling', to: '/student-support/counselling' },
      { component: CNavItem, name: 'Grievance', to: '/student-support/grievance' },
      { component: CNavItem, name: 'Anti Ragging', to: '/student-support/anti-ragging' },
      { component: CNavItem, name: 'SC / ST / OBC Cell', to: '/student-support/sc-st-obc-cell' },
      { component: CNavItem, name: 'Women Cell', to: '/student-support/women-cell' },
      { component: CNavItem, name: 'Minority Cell', to: '/student-support/minority-cell' },
      { component: CNavItem, name: 'Other Cells', to: '/student-support/other-cells' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Placement',
    to: '/placement',
    icon: icon(cilBriefcase),
    items: [
      { component: CNavItem, name: 'Drives', to: '/placement/drives' },
      { component: CNavItem, name: 'Offers', to: '/placement/offers' },
      { component: CNavItem, name: 'Higher Studies', to: '/placement/higher-studies' },
      { component: CNavItem, name: 'Entrepreneurship', to: '/placement/entrepreneurship' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Alumni',
    to: '/alumni',
    icon: icon(cilUser),
    items: [
      { component: CNavItem, name: 'Registration', to: '/alumni/registration' },
      { component: CNavItem, name: 'Contribution', to: '/alumni/contribution' },
      { component: CNavItem, name: 'Association', to: '/alumni/association' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Infrastructure',
    to: '/infrastructure',
    icon: icon(cilBuilding),
    items: [
      { component: CNavItem, name: 'Library', to: '/infrastructure/library' },
      { component: CNavItem, name: 'IT Facilities', to: '/infrastructure/it-facilities' },
      { component: CNavItem, name: 'Facilities', to: '/infrastructure/facilities' },
      { component: CNavItem, name: 'Maintenance', to: '/infrastructure/maintenance' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Compliances',
    to: '/compliances',
    icon: icon(cilBalanceScale),
    items: [
      { component: CNavItem, name: 'Online Data', to: '/compliances/online-data' },
      { component: CNavItem, name: 'AISHE', to: '/compliances/aishe' },
      { component: CNavItem, name: 'NIRF', to: '/compliances/nirf' },
      { component: CNavItem, name: 'Other', to: '/compliances/other' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Communication',
    to: '/communication',
    icon: icon(cilChatBubble),
    items: [
      { component: CNavItem, name: 'Circular', to: '/communication/circular' },
      { component: CNavItem, name: 'Notification', to: '/communication/notification' },
      { component: CNavItem, name: 'Message', to: '/communication/message' },
      { component: CNavItem, name: 'Email', to: '/communication/email' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Analytics',
    to: '/analytics',
    icon: icon(cilChartLine),
    items: [
      { component: CNavItem, name: 'Performance Metrics', to: '/analytics/performance-metrics' },
      { component: CNavItem, name: 'Outcome Metrics', to: '/analytics/outcome-metrics' },
      { component: CNavItem, name: 'Placement Metrics', to: '/analytics/placement-metrics' },
    ],
  },

  {
    component: CNavGroup,
    name: 'Gallery',
    to: '/gallery',
    icon: icon(cilImage),
    items: [{ component: CNavItem, name: 'Gallery', to: '/gallery' }],
  },
  {
    component: CNavGroup,
    name: 'FAQ',
    to: '/faq',
    icon: icon(cilInfo),
    items: [{ component: CNavItem, name: 'FAQ', to: '/faq' }],
  },

  {
    component: CNavTitle,
    name: 'ARP Management',
  },
  {
    component: CNavGroup,
    name: 'ARP',
    to: '/arp',
    icon: icon(cilCreditCard),
    items: [
      { component: CNavItem, name: 'Support & Helpdesk', to: '/arp/support-helpdesk' },
      { component: CNavItem, name: 'Invoices', to: '/arp/invoices' },
      { component: CNavItem, name: 'Payments', to: '/arp/payments' },
    ],
  },

  {
    component: CNavTitle,
    name: 'Authorization',
  },
  {
    component: CNavGroup,
    name: 'Authorization',
    to: '/auth',
    icon: icon(cilLockLocked),
    items: [
      { component: CNavItem, name: 'Admin', to: '/auth/admin' },
      { component: CNavItem, name: 'Groups', to: '/auth/groups' },
    ],
  },
]

export default _nav
