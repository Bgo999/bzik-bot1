"""
Fallback response system for when external APIs fail.
This ensures the bot always responds, even if OpenRouter API is unavailable.
"""

import random
import json
from datetime import datetime

class FallbackResponder:
    """Provides intelligent fallback responses when API is unavailable"""
    
    def __init__(self):
        self.greeting_responses = [
            "Hey there! 👋 How's it going?",
            "Hi! What can I help you with today?",
            "Hello! Great to see you! 😊",
            "Hey! What's on your mind?",
            "What's up! How can I assist?",
        ]
        
        self.how_are_you_responses = [
            "I'm doing great, thanks for asking! How about you?",
            "I'm fantastic! Ready to help. What about you?",
            "All systems go! 🚀 How are things with you?",
            "Feeling good! What can I do for you?",
            "I'm running smoothly! How can I help?",
        ]
        
        self.business_responses = {
            "business features": "I offer comprehensive business solutions including 24/7 customer support automation, intelligent lead generation, personalized marketing campaigns, data analytics, multi-language support, seamless API integration, and enterprise-grade security.",
            "features": "My key features include natural language processing, conversational AI, voice synthesis, mobile optimization, conversation memory, sentiment analysis, and multi-language support. I'm designed to work across all platforms!",
            "pricing": "Pricing varies based on your needs. I offer flexible plans for startups, growing businesses, and enterprises. Check with my team for a custom quote!",
            "api": "Yes, I have a full REST API for integration! It supports real-time chat, voice responses, user management, and custom webhooks. Documentation is available at our developer portal.",
            "integration": "I integrate with popular platforms like Slack, Teams, WhatsApp, Facebook Messenger, and more. Custom integrations are also available!",
        }
        
        self.about_responses = {
            "who are you": "I'm Bzik, an AI assistant powered by cutting-edge language models. I'm here to help you with conversations, customer support, and so much more!",
            "who created you": "I was created by Bagrat, the tech mastermind behind Bzik AI!",
            "what is your name": "I'm Bzik! Nice to meet you! 😊",
            "your boss": "Bagrat is the Boss — the one and only king! 👑",
            "bagrat": "Bagrat is the visionary founder of Bzik and ITox. An amazing entrepreneur and innovator!",
        }
        
        self.help_responses = [
            "I can help with conversation, answer questions, provide information, or just chat! What would you like?",
            "I'm here to assist! You can ask me about my features, services, or anything else on your mind.",
            "I can help with customer support, sales inquiries, technical questions, or general conversation. What interests you?",
            "Feel free to ask me anything! I'm designed to be helpful, informative, and friendly.",
        ]
        
        self.unknown_responses = [
            "That's an interesting question! While I don't have a specific answer right now, I'd love to help if you can tell me more.",
            "Hmm, I'm not sure about that one. Can you give me more context?",
            "That's a great question! I might not have all the details, but I'm always learning. What else can I help with?",
            "I'm not quite sure about that, but I'm happy to help with other questions!",
            "That's outside my current knowledge base, but feel free to ask something else!",
        ]
    
    def get_response(self, user_message: str, context: dict = None) -> str:
        """
        Generate a fallback response based on user message.
        Args:
            user_message: The user's input message
            context: Optional context dict with user history
        Returns:
            A relevant fallback response
        """
        if not user_message:
            return random.choice(self.help_responses)
        
        message_lower = user_message.lower().strip()
        
        # Check for greetings
        if message_lower in ['hi', 'hello', 'hey', 'yo', 'sup', 'what\'s up', 'hey there']:
            return random.choice(self.greeting_responses)
        
        # Check for "how are you"
        if any(phrase in message_lower for phrase in ['how are you', 'how you doing', 'how\'s it going', 'how you been']):
            return random.choice(self.how_are_you_responses)
        
        # Check business/feature questions
        for key, response in self.business_responses.items():
            if key in message_lower:
                return response
        
        # Check about/who are you questions
        for key, response in self.about_responses.items():
            if key in message_lower:
                return response
        
        # Check for help requests
        if any(word in message_lower for word in ['help', 'assist', 'support', 'what can you']):
            return random.choice(self.help_responses)
        
        # Check for gratitude
        if any(word in message_lower for word in ['thank', 'thanks', 'appreciate', 'grateful']):
            return "You're very welcome! Happy to help! 😊"
        
        # Check for goodbye/exit
        if any(word in message_lower for word in ['bye', 'goodbye', 'see you', 'take care', 'exit', 'quit']):
            return "Goodbye! It was great chatting with you. Have an awesome day! 👋"
        
        # Generic fallback for unknown queries
        return self.generate_contextual_response(user_message, context)
    
    def generate_contextual_response(self, user_message: str, context: dict = None) -> str:
        """Generate a contextual response that acknowledges user input"""
        keywords = self.extract_keywords(user_message)
        
        if keywords:
            # Build a response that references their message
            responses = [
                f"That's a great point about {keywords[0]}! I'd love to learn more.",
                f"Interesting question about {keywords[0]}! Here's what I know: I'm always happy to help with topics like this.",
                f"When it comes to {keywords[0]}, I think that's really important. How can I assist further?",
            ]
            return random.choice(responses)
        
        return random.choice(self.unknown_responses)
    
    def extract_keywords(self, text: str, limit: int = 3) -> list:
        """Extract important keywords from text"""
        # Simple keyword extraction
        stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'be', 'was', 'were', 'i', 'you', 'we', 'he', 'she', 'it', 'what', 'how', 'why', 'when', 'where', 'can', 'could', 'would', 'should', 'do', 'does', 'did', 'will', 'have', 'has', 'had'}
        
        words = text.lower().split()
        keywords = [w for w in words if len(w) > 3 and w not in stop_words and w.isalpha()]
        return keywords[:limit]


def get_fallback_response(user_message: str, selected_voice: str = "Anna", context: dict = None) -> dict:
    """
    Get a fallback response with all required fields for the chat endpoint.
    
    Args:
        user_message: The user's message
        selected_voice: The selected voice (Anna, Irish, Alexa, Jak, Alecx)
        context: Optional conversation context
    
    Returns:
        Dict with reply, voice info, and session data
    """
    responder = FallbackResponder()
    reply = responder.get_response(user_message, context)
    
    backend_voice_map = {
        'Anna': 'Microsoft Zira',
        'Irish': 'Microsoft Siobhan',
        'Alexa': 'Amazon Alexa',
        'Jak': 'Microsoft Jak',
        'Alecx': 'Microsoft Alecx'
    }
    
    return {
        "reply": reply,
        "voice_response_finished": True,
        "selected_voice": selected_voice,
        "backend_voice": backend_voice_map.get(selected_voice, 'Microsoft Zira'),
        "message_saved": True,
        "timestamp": datetime.now().timestamp(),
        "success": True,
        "source": "fallback",
        "is_mobile": False,
        "voice_session": {
            "active": True,
            "should_listen": True,
            "listening_until": datetime.now().timestamp() + 120,
            "time_remaining": 120
        }
    }


if __name__ == "__main__":
    # Test the fallback responder
    responder = FallbackResponder()
    
    test_messages = [
        "Hi there!",
        "How are you?",
        "Tell me about your business features",
        "Who created you?",
        "What can you help with?",
        "Random question about machine learning",
        "Thanks for your help!",
        "Goodbye!"
    ]
    
    print("🤖 Fallback Response System Test")
    print("=" * 50)
    
    for msg in test_messages:
        response = responder.get_response(msg)
        print(f"\n📝 User: {msg}")
        print(f"🤖 Bot: {response}")
