import React from 'react';
import { ProgressBar as PrimeProgressBar } from 'primereact/progressbar';

const ProgressBar = ({ percentage }) => {
  return <PrimeProgressBar value={percentage ?? 0} showValue={false} />;
};

export default ProgressBar;