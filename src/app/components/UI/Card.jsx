'use client';

const Card = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <div className="h-full">
        {children}
      </div>
    </div>
  );
};

export default Card;
