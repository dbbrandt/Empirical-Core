class Types::ResponseType < Types::BaseObject

  field :id, ID, null: false
  field :question_id, ID, null: false
  field :submissions, Integer, null: false
  field :text, String, null: false
end