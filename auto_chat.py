import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import threading

def run_automation():
    # Set up WebDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)

    try:
        # First, sign in to main site
        driver.get("https://www.free4talk.com")

        # Wait for page load
        time.sleep(5)

        # Handle login
        try:
            # Find email input (assuming type email or id)
            email_input = driver.find_element(By.XPATH, "//input[@type='email']")  # Adjust if needed
            email_input.send_keys("dj55jggg@gmail.com")
            # Find sign in button using class and text
            signin_button = driver.find_element(By.XPATH, "//button[contains(@class, 'ant-btn') and contains(., 'Sign in')]")
            signin_button.click()
            time.sleep(5)
            print("Signed in with email")
        except Exception as e:
            print(f"Sign in failed or error: {e}")
            print("Available elements: " + ', '.join(set([elem.get_attribute('id') for elem in driver.find_elements(By.CSS_SELECTOR, '*') if elem.get_attribute('id')])))
            print("Available buttons: " + ', '.join([elem.text for elem in driver.find_elements(By.TAG_NAME, 'button')]))

        # Navigate to the chat room
        driver.get("https://www.free4talk.com/room/Qqb52")

        # Wait for room load
        time.sleep(5)

        # Enter room if needed
        try:
            join_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Join') or contains(text(), 'Enter')]")  # Adjust
            join_button.click()
            time.sleep(3)
            print("Entered room")
        except Exception as e:
            print(f"No enter button or error: {e}")

        # Find chat elements (adjust selectors based on site inspection)
        try:
            chat_input = driver.find_element(By.ID, "chat-input")  # Adjust
            send_button = driver.find_element(By.ID, "send-button")  # Adjust
            print("Chat elements found")
        except Exception as e:
            print(f"Chat input or send button not found: {e}")
            print("Available elements: " + ', '.join([elem.get_attribute('id') for elem in driver.find_elements(By.CSS_SELECTOR, '*') if elem.get_attribute('id')]))
            return  # Exit if can't find chat

        last_message = ""

        while True:
            # Check for new messages
            try:
                messages = driver.find_elements(By.CLASS_NAME, "chat-message")  # Adjust class
                if messages:
                    latest_message = messages[-1].text  # Get latest
                    if latest_message != last_message:
                        last_message = latest_message

                        # Extract user and message, assume format "User: Message"
                        if ": " in latest_message:
                            user_part, user_message = latest_message.split(": ", 1)
                            # Skip own messages if detected
                            if not user_part.lower().startswith("bzik"):
                                # Send to API
                                try:
                                    response = requests.post('http://localhost:5000/chat', json={'message': user_message, 'user_id': user_part}, timeout=10)
                                    if response.status_code == 200:
                                        reply = response.json()['reply']
                                        # Type in chat
                                        chat_input.send_keys(reply)
                                        send_button.click()
                                    else:
                                        print(f"ChatAPI error: {response.status_code} - {response.text}")
                                except Exception as e:
                                    print(f"ChatAPI request failed: {e}")
            except Exception as e:
                print(f"Error in chat monitoring: {e}")

            time.sleep(2)  # Poll every 2 seconds

    except Exception as e:
        print(f"Automation error: {e}")
    finally:
        driver.quit()

# Run in thread
thread = threading.Thread(target=run_automation)
thread.start()
print("Automation started. Make sure Flask is running on localhost:5000")

# Keep script running to allow thread
while True:
    time.sleep(1)
