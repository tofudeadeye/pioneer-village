import type { ChangeEvent } from 'react';

import DOBPicker from '../components/dob-picker';
import Section from '../components/section';
import styles from './info-tab.module.scss';

interface InfoTabProps {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onDateOfBirthChange: (value: string) => void;
}

export default function InfoTab({
  firstName,
  lastName,
  dateOfBirth,
  onFirstNameChange,
  onLastNameChange,
  onDateOfBirthChange,
}: InfoTabProps) {
  const handleFirstNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onFirstNameChange(e.target.value);
  };

  const handleLastNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onLastNameChange(e.target.value);
  };

  return (
    <>
      <Section label="Identity">
        <div className={styles.nameRow}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>First Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={handleFirstNameChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Last Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={handleLastNameChange}
            />
          </div>
        </div>
      </Section>

      <Section label="Date of Birth">
        <DOBPicker value={dateOfBirth} onChange={onDateOfBirthChange} />
      </Section>
    </>
  );
}
