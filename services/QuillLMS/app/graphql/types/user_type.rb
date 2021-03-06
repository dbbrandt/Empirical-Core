class Types::UserType < Types::BaseObject
  graphql_name 'User'

  field :id, ID, null: false
  field :name, String, null: false
  field :email, String, null: true
  field :username, String, null: true
  field :role, String, null: false
  field :time_zone, String, null: true

  field :notifications, [Types::NotificationType], null: true

  field :activity_scores, [Types::ActivityScoreType], null: true
  field :recommended_activities, [Int], null: true
  field :completed_diagnostic, Boolean, null: false

  def notifications
    object.notifications.order("created_at DESC").limit(10)
  end

  def activity_scores 
    scores = ActivitySession.find_by_sql("
      SELECT 
        activity_sessions.activity_id as activity_id,
        MAX(activity_sessions.percentage) as percentage,
        MAX(activity_sessions.updated_at) AS updated_at,
        SUM(CASE WHEN activity_sessions.state = 'started' THEN 1 ELSE 0 END) AS resume_link
      FROM activity_sessions
      
      WHERE activity_sessions.user_id = #{object.id}
      GROUP BY activity_sessions.activity_id
    ")
  end

  def recommended_activities
    if completed_diagnostic
      diagnostic_session = ActivitySession.where(user_id: object.id, activity_id: 413, state: "finished").last
      counted_concept_results = concept_results_by_count(diagnostic_session)
      units = get_recommended_units(counted_concept_results)
      return get_acts_from_recommended_units(units).flatten
    else
      return []
    end
   
  end

  def completed_diagnostic
    ActivitySession.where(user_id: object.id, activity_id: 413, state: "finished").any?
  end

  private 

  def get_recommended_units(concept_result_scores)
    units = []
    recommendations = Recommendation.where(activity_id: 413, category: 0).map do |activity_pack_recommendation|
      activity_pack_recommendation.criteria.each do |req|
        if req.no_incorrect && concept_result_scores[req[:concept_id]]["total"] > concept_result_scores[req[:concept_id]]["correct"]
          units.pusharr(activity_pack_recommendation[:unit_template_id])
          break
        end
        if concept_result_scores[req[:concept_id]]["correct"] < req[:count]
          units.push(activity_pack_recommendation[:unit_template_id])
          break
        end
      end
      return units
    end
    units
  end

  def get_acts_from_recommended_units(units)
    units.map do |actpackid|
      UnitTemplate.find(actpackid).activities.map(&:id)
    end 
  end

  def concept_results_by_count activity_session
    hash = Hash.new { |h, k| h[k] = Hash.new { |j, l| j[l] = 0 } }
    activity_session.concept_results.each do |concept_result|
      hash[concept_result.concept.uid]["correct"] += concept_result["metadata"]["correct"]
      hash[concept_result.concept.uid]["total"] += 1
    end
    hash
  end
end