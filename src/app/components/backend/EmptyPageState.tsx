import React from 'react';
import { Inbox } from 'lucide-react';
import {
  BackendButton,
  BackendPageHeader,
  BackendEmptyState,
  BackendPageContainer,
} from './ui';

interface EmptyPageStateProps {
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyPageState({ title, description, actionButton }: EmptyPageStateProps) {
  return (
    <BackendPageContainer className="h-full flex flex-col">
      <BackendPageHeader
        title={title}
        actions={
          actionButton ? (
            <BackendButton variant="primary" onClick={actionButton.onClick}>
              {actionButton.label}
            </BackendButton>
          ) : undefined
        }
      />
      <div className="flex-1 flex items-center justify-center">
        <BackendEmptyState
          card={false}
          size="lg"
          icon={<Inbox className="w-7 h-7" />}
          title="No data yet"
          description={description}
        />
      </div>
    </BackendPageContainer>
  );
}
