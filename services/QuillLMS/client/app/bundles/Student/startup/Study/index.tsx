import React from 'react';
import { ApolloProvider, Query, } from "react-apollo";
import client from '../../../../modules/apollo';
import gql from "graphql-tag";
import Activities from './activities';

const selfStudyQuery = `
  {
    currentUser {
      id
      name
      activityScores {
        activityId
        percentage
        updatedAt
        inProgress
      }
      recommendedActivities
      completedDiagnostic
    }

    activityCategories {
      id
      name
      orderNumber
      activities {
        id
        name
      }
      activityOrders{
        orderNumber
        activityId
      }
    }
  }
`;

export interface Activity {
  id: number
  name: string
  activityClassificationId: number
  orderNumber: number
}

export interface ActivityCategory {
  id: number
  name: string
  orderNumber: number
  activities: Activity[]
}

export interface ActivityScore {
  activityId: number
  percentage: number
  updatedAt: number
  inProgress: number
}

export interface User {
  id: number
  name: string
  activityScores: ActivityScore[]
  recommendedActivities: number[]
  completedDiagnostic: boolean
}

export interface SelfStudyQueryResponse {
  currentUser: User
  activityCategories: ActivityCategory[]
}

export interface QueryState {
  loading: boolean
  error: boolean
  data: SelfStudyQueryResponse
}

export interface StudyProps {
}

export default function Study() {
  return (
    <ApolloProvider client={client}>
      <div className="container">
      <Query
        query={gql(selfStudyQuery)}
      >
      {({ loading, error, data }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error :(</p>;
        const payload = data;
        return (
          <div>
            <p>{data.currentUser.name}</p>
            <Activities 
              activities={data.activityCategories} 
              scores={data.currentUser.activityScores}
              recommendations={data.currentUser.recommendedActivities}
            />
          </div>
        )
      }}
        </Query>
      </div>
    </ApolloProvider>
  );
};