import { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from 'date-fns';

interface ConsultationCountdownProps {
  deadline: string | Date;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export default function ConsultationCountdown({
  deadline,
  variant = 'compact',
  className = ''
}: ConsultationCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, expired: false });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);

      if (isPast(deadlineDate)) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, expired: true });
        return;
      }

      const days = differenceInDays(deadlineDate, now);
      const hours = differenceInHours(deadlineDate, now) % 24;
      const minutes = differenceInMinutes(deadlineDate, now) % 60;

      setTimeRemaining({ days, hours, minutes, expired: false });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every minute
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [deadline]);

  const deadlineDate = new Date(deadline);
  const isUrgent = timeRemaining.days <= 3 && !timeRemaining.expired;
  const isWarning = timeRemaining.days <= 7 && timeRemaining.days > 3 && !timeRemaining.expired;

  if (variant === 'compact') {
    if (timeRemaining.expired) {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium ${className}`}>
          <Clock className="h-3.5 w-3.5" />
          <span>Consultation closed</span>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isUrgent ? 'bg-red-100 text-red-700' :
        isWarning ? 'bg-yellow-100 text-yellow-700' :
        'bg-green-100 text-green-700'
      } ${className}`}>
        <Clock className="h-3.5 w-3.5" />
        <span>
          {timeRemaining.days > 0 ? (
            `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''} left`
          ) : timeRemaining.hours > 0 ? (
            `${timeRemaining.hours} hour${timeRemaining.hours !== 1 ? 's' : ''} left`
          ) : (
            `${timeRemaining.minutes} minute${timeRemaining.minutes !== 1 ? 's' : ''} left`
          )}
        </span>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`rounded-lg border ${
      timeRemaining.expired ? 'border-gray-200 bg-gray-50' :
      isUrgent ? 'border-red-200 bg-red-50' :
      isWarning ? 'border-yellow-200 bg-yellow-50' :
      'border-green-200 bg-green-50'
    } p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          timeRemaining.expired ? 'bg-gray-200' :
          isUrgent ? 'bg-red-200' :
          isWarning ? 'bg-yellow-200' :
          'bg-green-200'
        }`}>
          {timeRemaining.expired ? (
            <AlertCircle className="h-5 w-5 text-gray-600" />
          ) : (
            <Clock className="h-5 w-5 text-gray-700" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">
            {timeRemaining.expired ? 'Consultation Period Closed' : 'Consultation Period'}
          </h4>

          {timeRemaining.expired ? (
            <p className="text-sm text-gray-600">
              The consultation period ended on {format(deadlineDate, 'dd MMMM yyyy')}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Closes on {format(deadlineDate, 'dd MMMM yyyy \'at\' HH:mm')}</span>
              </div>

              <div className="flex flex-wrap gap-3 mt-3">
                {timeRemaining.days > 0 && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      isUrgent ? 'text-red-700' :
                      isWarning ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {timeRemaining.days}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">
                      Day{timeRemaining.days !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {(timeRemaining.days <= 7 || timeRemaining.days === 0) && timeRemaining.hours > 0 && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      isUrgent ? 'text-red-700' :
                      isWarning ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {timeRemaining.hours}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">
                      Hour{timeRemaining.hours !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {timeRemaining.days === 0 && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      isUrgent ? 'text-red-700' :
                      isWarning ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {timeRemaining.minutes}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">
                      Minute{timeRemaining.minutes !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>

              {isUrgent && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-red-700 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Closing soon - submit representations urgently</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}