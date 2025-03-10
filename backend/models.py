from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Models
class PromptRequest(BaseModel):
    text: str

class PromptResponse(BaseModel):
    enhancedText: str

class PromptTemplate(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    category: str
    userId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class PromptTemplateList(BaseModel):
    templates: List[PromptTemplate]

# New models for prompts, variables, and history
class PromptVariable(BaseModel):
    name: str
    value: str

class Prompt(BaseModel):
    id: Optional[str] = None
    promptName: str
    promptDescription: str
    promptText: str
    color: str = "#666460"  # Default color
    variables: Optional[List[PromptVariable]] = None
    userId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class PromptList(BaseModel):
    prompts: List[Prompt]

class Variable(BaseModel):
    id: Optional[str] = None
    variableName: str
    variableValue: str
    color: str = "#666460"  # Default color
    userId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class VariableList(BaseModel):
    variables: List[Variable]

class HistoryEntry(BaseModel):
    id: Optional[str] = None
    originalPrompt: str
    enhancedPrompt: str
    userId: Optional[str] = None
    timestamp: Optional[datetime] = None

class HistoryList(BaseModel):
    history: List[HistoryEntry]
